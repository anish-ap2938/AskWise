#!/usr/bin/env python3
"""
Build AskWise SFT data with a local teacher model (GPU).

The old seed data used the Instant draft as the training target, which only ever
taught the student to echo the deterministic rewriter. Here a stronger local model
(qwen3:8b) polishes each draft into a genuinely better prompt, and the result is
validated before it becomes a target.

Input:  training/data/raw/sft_drafts.jsonl  (from scripts/export-drafts.ts —
        carries the exact system/user strings the extension builds at runtime)
Output: training/data/prompt_sft.jsonl      (chat-format SFT rows)

Run:
    python training/14_build_sft_teacher.py --limit 12000 --workers 5
"""

from __future__ import annotations

import argparse
import json
import re
import threading
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from lib_label import ollama_chat

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "data" / "raw"

TEACHER_ADDENDUM = """

You are producing a GOLD reference rewrite that a smaller model will learn from.
- Start from the Instant draft; keep what already works and fix what doesn't.
- Silently correct every spelling and grammar error from the raw request.
- Cut filler. Every sentence must carry information the target AI can act on.
- Do NOT answer or solve the user's task. You only rewrite the request.
- Do NOT add placeholders like [insert detail] unless the request truly requires
  the user to supply something only they know.
- structured: at most 110 words. advanced: at most 200 words.
Return ONLY the JSON object."""

WORD_RE = re.compile(r"\S+")

# Phrases that mean the model started answering instead of rewriting.
LEAKED_ANSWER = re.compile(
    r"^(sure|certainly|here('s| is) (the|your|a)|i'?d be happy|of course|absolutely)\b",
    re.I,
)


def words(text: str) -> int:
    return len(WORD_RE.findall(text))


def load_jsonl(path: Path) -> list[dict]:
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return rows


def extract_json(raw: str) -> dict | None:
    m = re.search(r"\{[\s\S]*\}", raw)
    if not m:
        return None
    try:
        obj = json.loads(m.group(0))
    except json.JSONDecodeError:
        return None
    return obj if isinstance(obj, dict) else None


def validate(obj: dict, row: dict) -> tuple[bool, str]:
    structured = obj.get("structured")
    advanced = obj.get("advanced")
    if not isinstance(structured, str) or not isinstance(advanced, str):
        return False, "missing keys"
    if len(structured.strip()) < 20 or len(advanced.strip()) < 20:
        return False, "too short"
    if words(structured) > 150:
        return False, "structured too long"
    if words(advanced) > 260:
        return False, "advanced too long"
    if LEAKED_ANSWER.match(structured.strip()) or LEAKED_ANSWER.match(advanced.strip()):
        return False, "answered instead of rewriting"
    if structured.strip() == advanced.strip():
        return False, "variants identical"
    # The rewrite must still be about the user's request.
    raw_words = {w.lower() for w in WORD_RE.findall(row["text"]) if len(w) > 4}
    if raw_words:
        kept = sum(1 for w in raw_words if w in structured.lower() or w in advanced.lower())
        if kept / len(raw_words) < 0.15:
            return False, "drifted off topic"
    return True, ""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--drafts", type=Path, default=RAW / "sft_drafts.jsonl")
    ap.add_argument("--out", type=Path, default=ROOT / "data" / "prompt_sft.jsonl")
    ap.add_argument("--model", type=str, default="qwen3:8b")
    ap.add_argument("--host", type=str, default="http://127.0.0.1:11434")
    ap.add_argument("--limit", type=int, default=12000)
    ap.add_argument("--workers", type=int, default=5)
    args = ap.parse_args()

    drafts = load_jsonl(args.drafts)
    if not drafts:
        raise SystemExit(f"no drafts at {args.drafts} (run scripts/export-drafts.ts)")

    done = set()
    if args.out.exists():
        for r in load_jsonl(args.out):
            raw = r.get("meta", {}).get("raw")
            if raw:
                done.add(raw)

    todo = [d for d in drafts if d["text"] not in done][: args.limit]
    print(f"drafts={len(drafts)} done={len(done)} to_build={len(todo)}", flush=True)
    if not todo:
        return

    lock = threading.Lock()
    fh = args.out.open("a", encoding="utf-8")
    stats: dict[str, int] = {"ok": 0, "bad": 0, "n": 0}
    reasons: dict[str, int] = {}
    total = len(todo)

    def work(row: dict) -> None:
        try:
            raw = ollama_chat(
                args.model,
                row["user"],
                args.host,
                system=row["system"] + TEACHER_ADDENDUM,
                temperature=0.3,
            )
        except (urllib.error.URLError, TimeoutError, OSError):
            with lock:
                stats["n"] += 1
                stats["bad"] += 1
                reasons["request failed"] = reasons.get("request failed", 0) + 1
            return

        obj = extract_json(raw)
        ok, why = (False, "unparseable") if obj is None else validate(obj, row)

        with lock:
            stats["n"] += 1
            if not ok:
                stats["bad"] += 1
                reasons[why] = reasons.get(why, 0) + 1
            else:
                assistant = json.dumps(
                    {
                        "structured": obj["structured"].strip(),
                        "advanced": obj["advanced"].strip(),
                    },
                    ensure_ascii=False,
                )
                fh.write(
                    json.dumps(
                        {
                            "messages": [
                                {"role": "system", "content": row["system"]},
                                {"role": "user", "content": row["user"]},
                                {"role": "assistant", "content": assistant},
                            ],
                            "meta": {
                                "mode": row["mode"],
                                "subRecipe": row.get("subRecipe"),
                                "raw": row["text"],
                                "source": "teacher",
                            },
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
                stats["ok"] += 1
            if stats["n"] % 200 == 0:
                fh.flush()
                print(
                    f"  {stats['n']}/{total} | kept={stats['ok']} rejected={stats['bad']}",
                    flush=True,
                )

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = [ex.submit(work, r) for r in todo]
        for _ in as_completed(futures):
            pass

    fh.close()
    print(f"\nkept {stats['ok']} / {stats['n']} -> {args.out}")
    if reasons:
        print("rejections:")
        for why, n in sorted(reasons.items(), key=lambda kv: -kv[1]):
            print(f"  {why:32} {n}")


if __name__ == "__main__":
    main()
