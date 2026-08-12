#!/usr/bin/env python3
"""Compare a cheaper judge model against the qwen3:8b labels we already have."""

from __future__ import annotations

import argparse
import json
import time
import urllib.error
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from lib_label import classify_one

ROOT = Path(__file__).resolve().parent


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--reference", type=Path, default=ROOT / "data" / "raw" / "labeled.jsonl")
    ap.add_argument("--model", type=str, default="qwen3:4b")
    ap.add_argument("--n", type=int, default=300)
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()

    rows = []
    for line in args.reference.read_text(encoding="utf-8").splitlines():
        if line.strip():
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    rows = rows[: args.n]
    print(f"comparing {args.model} against qwen3:8b on {len(rows)} rows")

    def judge(r: dict) -> tuple[str, str | None]:
        try:
            return r["mode"], classify_one(r["text"], args.model)
        except (urllib.error.URLError, TimeoutError, OSError):
            return r["mode"], None

    t0 = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        results = list(ex.map(judge, rows))
    elapsed = time.time() - t0

    valid = [(a, b) for a, b in results if b]
    agree = sum(1 for a, b in valid if a == b)
    print(f"throughput: {len(rows) / elapsed:.2f} rows/s ({elapsed:.1f}s)")
    print(f"agreement:  {agree}/{len(valid)} = {agree / max(1, len(valid)):.1%}")

    disagreements: dict[tuple[str, str], int] = {}
    for a, b in valid:
        if a != b:
            disagreements[(a, b)] = disagreements.get((a, b), 0) + 1
    print("top disagreements (8b -> cheap):")
    for (a, b), n in sorted(disagreements.items(), key=lambda kv: -kv[1])[:10]:
        print(f"  {a:15} -> {b:15} {n}")


if __name__ == "__main__":
    main()
