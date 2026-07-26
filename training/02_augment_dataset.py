#!/usr/bin/env python3
"""Augment seed SFT with spelling variants + paraphrases for AskWise rewrite task."""

from __future__ import annotations

import argparse
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

TYPO_SWAPS = [
    ("bakery", "backery"),
    ("fitness", "fitnes"),
    ("build", "bild"),
    ("web", "wep"),
    ("website", "websit"),
    ("business", "bussiness"),
    ("calendar", "calender"),
    ("separate", "seperate"),
    ("receive", "recieve"),
    ("definitely", "definately"),
]


def load_jsonl(path: Path) -> list[dict]:
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def inject_typos(text: str, rng: random.Random) -> str:
    out = text
    for correct, wrong in TYPO_SWAPS:
        if correct in out.lower() and rng.random() < 0.55:
            # case-insensitive replace of first occurrence only
            pattern = re.compile(re.escape(correct), re.I)

            def repl(m: re.Match[str]) -> str:
                src = m.group(0)
                if src.isupper():
                    return wrong.upper()
                if src[0].isupper():
                    return wrong.capitalize()
                return wrong

            out, n = pattern.subn(repl, out, count=1)
            if n:
                break
    # casual casing
    if rng.random() < 0.35 and out and out[0].isupper():
        out = out[0].lower() + out[1:]
    return out


def extract_raw(user_content: str) -> str | None:
    m = re.search(r"<raw_prompt>(.*?)</raw_prompt>", user_content, re.S)
    return m.group(1).strip() if m else None


def rewrite_user(user_content: str, new_raw: str) -> str:
    return re.sub(
        r"<raw_prompt>.*?</raw_prompt>",
        f"<raw_prompt>{new_raw}</raw_prompt>",
        user_content,
        count=1,
        flags=re.S,
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=Path, default=ROOT / "data" / "seed_sft.jsonl")
    ap.add_argument("--out", type=Path, default=ROOT / "data" / "train_sft.jsonl")
    ap.add_argument("--copies", type=int, default=3, help="typo variants per seed")
    ap.add_argument("--seed-rng", type=int, default=42)
    args = ap.parse_args()

    rng = random.Random(args.seed_rng)
    seed = load_jsonl(args.seed)
    out: list[dict] = []

    for row in seed:
        out.append(row)
        user = row["messages"][1]["content"]
        raw = extract_raw(user)
        if not raw:
            continue
        for _ in range(args.copies):
            noisy = inject_typos(raw, rng)
            if noisy == raw:
                continue
            clone = json.loads(json.dumps(row))
            clone["messages"][1]["content"] = rewrite_user(user, noisy)
            clone["meta"] = {**(clone.get("meta") or {}), "augment": "typo"}
            out.append(clone)

    rng.shuffle(out)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as f:
        for row in out:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"Wrote {len(out)} rows → {args.out}")


if __name__ == "__main__":
    main()
