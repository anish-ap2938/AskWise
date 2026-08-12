#!/usr/bin/env python3
"""
Download open prompt corpora and build a candidate pool for AskWise intent labeling.

Pulls *real human* asks (oasst1, no_robots, dolly, hh-rlhf) plus instruction sets
with useful category metadata, normalizes them to first-user-turn prompts, and
writes a deduped pool with weak label hints:

    training/data/raw/pool.jsonl   {"text","source","hint"}

Run:
    python training/10_download_corpora.py --per-source 4000
"""

from __future__ import annotations

import argparse
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "data" / "raw"

# Weak hints only. The LLM labeler decides; hints break ties / sanity-check.
NO_ROBOTS_HINT = {
    "Generation": None,
    "Open QA": "simple_answer",
    "Closed QA": "simple_answer",
    "Brainstorm": "research",
    "Chat": "quick_improve",
    "Rewrite": "writing",
    "Summarize": "writing",
    "Coding": "coding_debug",
    "Classify": "data_analysis",
    "Extract": "data_analysis",
}

DOLLY_HINT = {
    "open_qa": "simple_answer",
    "closed_qa": "simple_answer",
    "general_qa": "simple_answer",
    "information_extraction": "data_analysis",
    "classification": "data_analysis",
    "summarization": "writing",
    "creative_writing": "writing",
    "brainstorming": "research",
}

NON_ENGLISH = re.compile(r"[\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]")
URL_ONLY = re.compile(r"^\s*https?://\S+\s*$")


def usable(text: str) -> bool:
    if not text:
        return False
    t = text.strip()
    n = len(t)
    if n < 12 or n > 700:
        return False
    if NON_ENGLISH.search(t):
        return False
    if URL_ONLY.match(t):
        return False
    # Skip pasted walls of content (we want asks, not documents)
    if t.count("\n") > 12:
        return False
    return True


def first_user_turn(messages) -> str:
    for m in messages or []:
        role = m.get("role") or m.get("from")
        if role in ("user", "human"):
            return str(m.get("content") or m.get("value") or "")
    return ""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-source", type=int, default=4000)
    ap.add_argument("--out", type=Path, default=RAW / "pool.jsonl")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    try:
        from datasets import load_dataset
    except ImportError:
        raise SystemExit("pip install datasets first")

    rng = random.Random(args.seed)
    RAW.mkdir(parents=True, exist_ok=True)
    rows: list[dict] = []

    def take(source: str, texts_hints) -> None:
        got = 0
        for text, hint in texts_hints:
            if not usable(text):
                continue
            rows.append({"text": text.strip(), "source": source, "hint": hint})
            got += 1
            if got >= args.per_source:
                break
        print(f"  {source}: +{got}")

    def try_source(name: str, fn) -> None:
        print(f"[{name}]")
        try:
            fn()
        except Exception as e:  # dataset gated / renamed / offline
            print(f"  skip {name}: {type(e).__name__}: {str(e)[:160]}")

    # --- real human asks -------------------------------------------------
    def oasst1():
        ds = load_dataset("OpenAssistant/oasst1", split="train")
        pairs = []
        for ex in ds:
            if ex.get("role") != "prompter" or ex.get("parent_id") is not None:
                continue
            if (ex.get("lang") or "en") != "en":
                continue
            pairs.append((str(ex.get("text") or ""), None))
        rng.shuffle(pairs)
        take("oasst1", pairs)

    def no_robots():
        ds = load_dataset("HuggingFaceH4/no_robots", split="train")
        pairs = []
        for ex in ds:
            text = first_user_turn(ex.get("messages"))
            pairs.append((text, NO_ROBOTS_HINT.get(str(ex.get("category") or ""))))
        rng.shuffle(pairs)
        take("no_robots", pairs)

    def dolly():
        ds = load_dataset("databricks/databricks-dolly-15k", split="train")
        pairs = []
        for ex in ds:
            instr = str(ex.get("instruction") or "")
            pairs.append((instr, DOLLY_HINT.get(str(ex.get("category") or ""))))
        rng.shuffle(pairs)
        take("dolly15k", pairs)

    def hh_rlhf():
        ds = load_dataset("Anthropic/hh-rlhf", split="train")
        pairs = []
        for ex in ds:
            chosen = str(ex.get("chosen") or "")
            m = re.search(r"Human:\s*(.+?)(?:\n\nAssistant:|$)", chosen, re.S)
            if m:
                pairs.append((m.group(1), None))
            if len(pairs) > args.per_source * 6:
                break
        rng.shuffle(pairs)
        take("hh_rlhf", pairs)

    # --- domain-heavy instruction sets ----------------------------------
    def code_alpaca():
        ds = load_dataset("sahil2801/CodeAlpaca-20k", split="train")
        pairs = [(str(ex.get("instruction") or ""), None) for ex in ds]
        rng.shuffle(pairs)
        take("code_alpaca", pairs)

    def sql_ctx():
        ds = load_dataset("b-mc2/sql-create-context", split="train")
        pairs = [(str(ex.get("question") or ""), "data_analysis") for ex in ds]
        rng.shuffle(pairs)
        take("sql_context", pairs)

    def awesome():
        ds = load_dataset("fka/awesome-chatgpt-prompts", split="train")
        pairs = [
            (f"i want a prompt that acts as {ex.get('act')}", "quick_improve") for ex in ds
        ]
        take("awesome_prompts", pairs)

    def smoltalk_rewrite():
        ds = load_dataset("HuggingFaceTB/smoltalk", "smol-rewrite", split="train")
        pairs = []
        for ex in ds:
            text = first_user_turn(ex.get("messages"))
            pairs.append((text, "writing"))
            if len(pairs) > args.per_source * 3:
                break
        rng.shuffle(pairs)
        take("smoltalk_rewrite", pairs)

    def alpaca_clean():
        ds = load_dataset("yahma/alpaca-cleaned", split="train")
        pairs = [(str(ex.get("instruction") or ""), None) for ex in ds]
        rng.shuffle(pairs)
        take("alpaca_cleaned", pairs)

    def open_platypus():
        ds = load_dataset("garage-bAInd/Open-Platypus", split="train")
        pairs = [(str(ex.get("instruction") or ""), None) for ex in ds]
        rng.shuffle(pairs)
        take("open_platypus", pairs)

    for name, fn in [
        ("oasst1", oasst1),
        ("no_robots", no_robots),
        ("dolly15k", dolly),
        ("hh_rlhf", hh_rlhf),
        ("code_alpaca", code_alpaca),
        ("sql_context", sql_ctx),
        ("awesome_prompts", awesome),
        ("smoltalk_rewrite", smoltalk_rewrite),
        ("alpaca_cleaned", alpaca_clean),
        ("open_platypus", open_platypus),
    ]:
        try_source(name, fn)

    # dedupe on normalized text
    seen: set[str] = set()
    unique: list[dict] = []
    for r in rows:
        key = re.sub(r"\s+", " ", r["text"].lower()).strip()
        if key in seen:
            continue
        seen.add(key)
        unique.append(r)

    rng.shuffle(unique)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as f:
        for r in unique:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"\nPool: {len(unique)} unique prompts -> {args.out}")
    by_source: dict[str, int] = {}
    for r in unique:
        by_source[r["source"]] = by_source.get(r["source"], 0) + 1
    for k, v in sorted(by_source.items(), key=lambda kv: -kv[1]):
        print(f"  {k:20} {v}")


if __name__ == "__main__":
    main()
