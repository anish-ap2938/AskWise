#!/usr/bin/env python3
"""
Check the labeling taxonomy against AskWise's hand-labeled fixtures.

The judge model defines every label in the training set, so if it disagrees with
the product's own fixtures the classifier inherits that disagreement. Run this
after editing TAXONOMY in lib_label.py.
"""

from __future__ import annotations

import argparse
import json
import random
import urllib.error
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from lib_label import MODES, classify_one

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", type=str, default="qwen3:8b")
    ap.add_argument("--per-mode", type=int, default=8)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--include-stretch", action="store_true")
    ap.add_argument("--modes", type=str, default="", help="comma-separated subset to judge")
    ap.add_argument("--all", action="store_true", help="judge every fixture, ignore --per-mode")
    args = ap.parse_args()

    fx = json.loads((REPO / "tests" / "fixtures" / "prompts.json").read_text(encoding="utf-8"))
    only = {m for m in args.modes.split(",") if m} or set(MODES)
    by_mode: dict[str, list[dict]] = {}
    for f in fx["fixtures"]:
        if f.get("stretch") and not args.include_stretch:
            continue
        if f["expected"] not in only:
            continue
        by_mode.setdefault(f["expected"], []).append(f)

    missing = sorted(only - by_mode.keys())
    if missing:
        print(f"warning: no fixtures for {', '.join(missing)}\n")

    # Sample the same way for every mode so the stratified slice stays comparable
    # across runs while still spanning the whole fixture file, not just its head.
    rng = random.Random(args.seed)
    sample: list[dict] = []
    for mode in sorted(by_mode):
        rows = sorted(by_mode[mode], key=lambda f: f["id"])
        if args.all or args.per_mode >= len(rows):
            sample.extend(rows)
        else:
            sample.extend(rng.sample(rows, args.per_mode))
    print(f"judging {len(sample)} fixtures across {len(by_mode)} modes with {args.model}\n", flush=True)

    def judge(f: dict) -> tuple[dict, str | None]:
        try:
            return f, classify_one(f["text"], args.model)
        except (urllib.error.URLError, TimeoutError, OSError):
            return f, None

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        results = list(ex.map(judge, sample))

    per_mode: dict[str, Counter] = {}
    ok = 0
    misses = []
    for f, got in results:
        want = f["expected"]
        per_mode.setdefault(want, Counter())[got or "ERROR"] += 1
        if got == want:
            ok += 1
        else:
            misses.append((f["id"], want, got, f["text"]))

    print(f"agreement with fixtures: {ok}/{len(results)} = {ok / len(results):.1%}\n")
    worst = []
    for want in sorted(per_mode):
        c = per_mode[want]
        total = sum(c.values())
        rate = c.get(want, 0) / total
        wrong = {k: v for k, v in c.items() if k != want}
        print(f"  {want:15} {c.get(want, 0)}/{total} = {rate:5.0%}  {wrong or ''}")
        if rate < 0.7:
            worst.append(want)

    if worst:
        print(f"\nmodes below 70%: {', '.join(worst)}")

    if misses:
        print("\ndisagreements (id | expected -> judge | text):")
        for fid, want, got, text in misses:
            print(f"  {fid:22} {want:15} -> {str(got):15} {text[:96]}")


if __name__ == "__main__":
    main()
