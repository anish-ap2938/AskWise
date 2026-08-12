#!/usr/bin/env python3
"""
Sensitivity check for the batched synth verifier.

Plants known outliers in a batch of same-mode prompts and reports whether the
judge flags exactly those. If recall is poor, synth data keeps its label noise.
"""

from __future__ import annotations

import argparse
import importlib
import json
from pathlib import Path

synth = importlib.import_module("13_synth_mode_prompts")

ROOT = Path(__file__).resolve().parent

OUTLIERS = [
    ("what is inflation", "simple_answer"),
    ("write a poem for my moms birthday", "writing"),
    ("i want to build a new app for dog walkers", "app_builder"),
    ("tailor my resume for a data analyst job", "resume_job"),
    ("my server returns a 500 error on every login", "coding_debug"),
]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pool", type=Path, default=ROOT / "data" / "raw" / "verify_smoke.jsonl")
    ap.add_argument("--mode", type=str, default="agent_task")
    ap.add_argument("--model", type=str, default="qwen3:8b")
    ap.add_argument("--host", type=str, default="http://127.0.0.1:11434")
    ap.add_argument("--rounds", type=int, default=4)
    ap.add_argument("--clean", type=int, default=9)
    args = ap.parse_args()

    rows = [json.loads(l) for l in args.pool.read_text(encoding="utf-8").splitlines() if l.strip()]
    clean = [r["text"] for r in rows if r["mode"] == args.mode]
    if len(clean) < args.clean * args.rounds:
        clean = (clean * args.rounds)[: args.clean * args.rounds]

    tp = fp = fn = 0
    for r in range(args.rounds):
        batch = clean[r * args.clean : (r + 1) * args.clean]
        planted = [OUTLIERS[r % len(OUTLIERS)], OUTLIERS[(r + 2) % len(OUTLIERS)]]
        texts = batch + [t for t, _ in planted]
        planted_idx = set(range(len(batch), len(texts)))

        keep = synth.verify_batch(texts, args.mode, args.model, args.host)
        flagged = {i for i, ok in enumerate(keep) if not ok}

        tp += len(flagged & planted_idx)
        fn += len(planted_idx - flagged)
        fp += len(flagged - planted_idx)
        print(
            f"round {r}: flagged={sorted(flagged)} planted={sorted(planted_idx)} "
            f"({'caught both' if planted_idx <= flagged else 'MISSED'})"
        )

    total = tp + fn
    print(f"\noutlier recall:    {tp}/{total} = {tp / max(1, total):.0%}")
    print(f"false positives:   {fp} (good prompts wrongly dropped)")


if __name__ == "__main__":
    main()
