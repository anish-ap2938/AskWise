#!/usr/bin/env python3
"""
Sample a balanced pool of raw prompts for the SFT teacher pass.

Draws from the labeled real-world corpus and the synthetic mode data, balances
across modes, and keeps a realistic share of messy/typo-laden input so the
fine-tuned model sees the kind of text people actually paste into a composer.

Output: training/data/raw/sft_pool.jsonl  {"text","mode"}
Next:   npx tsx scripts/export-drafts.ts training/data/raw/sft_pool.jsonl \
            training/data/raw/sft_drafts.jsonl

Run:
    python training/14_build_sft_pool.py --per-mode 900
"""

from __future__ import annotations

import argparse
import json
import random
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "data" / "raw"

TYPO_SWAPS = [
    ("the", "teh"), ("and", "adn"), ("you", "u"), ("your", "ur"),
    ("with", "wiht"), ("for", "fro"), ("that", "taht"), ("this", "tihs"),
    ("what", "waht"), ("want", "wnat"), ("need", "ned"), ("make", "mak"),
    ("write", "wirte"), ("help", "hlep"), ("please", "plz"), ("because", "becuase"),
    ("really", "realy"), ("should", "shoud"), ("would", "woudl"), ("about", "abot"),
    ("bakery", "backery"), ("website", "wepsite"), ("build", "bild"),
]


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return rows


def messify(text: str, rng: random.Random) -> str:
    out = text
    swaps = rng.sample(TYPO_SWAPS, k=min(4, len(TYPO_SWAPS)))
    for a, b in swaps:
        out = re.sub(rf"\b{a}\b", b, out, flags=re.I)
    if rng.random() < 0.7:
        out = out.lower()
    if rng.random() < 0.5:
        out = re.sub(r"[.,;!]", "", out)
    return out.strip()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--labeled", type=Path, default=RAW / "labeled.jsonl")
    ap.add_argument("--synth", type=Path, default=RAW / "synth.jsonl")
    ap.add_argument("--out", type=Path, default=RAW / "sft_pool.jsonl")
    ap.add_argument("--per-mode", type=int, default=900)
    ap.add_argument("--messy-share", type=float, default=0.35)
    ap.add_argument("--max-chars", type=int, default=400)
    ap.add_argument("--seed", type=int, default=11)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    rows = load_jsonl(args.labeled) + load_jsonl(args.synth)
    if not rows:
        raise SystemExit("no labeled or synthetic data yet")

    by_mode: dict[str, list[str]] = {}
    seen: set[str] = set()
    for r in rows:
        text = r["text"].strip()
        if len(text) > args.max_chars:
            continue
        key = re.sub(r"\s+", " ", text.lower())
        if key in seen:
            continue
        seen.add(key)
        by_mode.setdefault(r["mode"], []).append(text)

    out: list[dict] = []
    for mode, pool in by_mode.items():
        rng.shuffle(pool)
        picked = pool[: args.per_mode]
        for text in picked:
            # Some prompts arrive already messy; roughen a share of the clean ones
            # so the student practises silent spelling repair.
            if rng.random() < args.messy_share:
                text = messify(text, rng)
            out.append({"text": text, "mode": mode})

    rng.shuffle(out)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as f:
        for r in out:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"sft pool: {len(out)} prompts -> {args.out}")
    for mode, n in Counter(r["mode"] for r in out).most_common():
        print(f"  {mode:15} {n}")


if __name__ == "__main__":
    main()
