#!/usr/bin/env python3
"""
Label pooled prompts into AskWise ModeIds using a local Ollama model (GPU).

Resumable and parallel. Writes:
    training/data/raw/labeled.jsonl   {"text","mode","source","hint","hint_agrees"}

Run (Ollama must be running):
    python training/11_autolabel_modes.py --limit 40000 --model qwen3:8b --workers 6
"""

from __future__ import annotations

import argparse
import json
import re
import threading
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from lib_label import ollama_chat, parse_label

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "data" / "raw"


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


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pool", type=Path, default=RAW / "pool.jsonl")
    ap.add_argument("--out", type=Path, default=RAW / "labeled.jsonl")
    ap.add_argument("--model", type=str, default="qwen3:8b")
    ap.add_argument("--host", type=str, default="http://127.0.0.1:11434")
    ap.add_argument("--limit", type=int, default=8000)
    ap.add_argument("--workers", type=int, default=6)
    args = ap.parse_args()

    pool = load_jsonl(args.pool)
    if not pool:
        raise SystemExit(f"empty pool: {args.pool} (run 10_download_corpora.py)")

    done = {r["text"] for r in load_jsonl(args.out)}
    todo = [r for r in pool if r["text"] not in done][: args.limit]
    print(f"pool={len(pool)} already_labeled={len(done)} to_label={len(todo)}", flush=True)
    if not todo:
        return

    lock = threading.Lock()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    fh = args.out.open("a", encoding="utf-8")
    stats = {"ok": 0, "fail": 0, "n": 0}
    total = len(todo)

    def work(r: dict) -> None:
        one_line = re.sub(r"\s+", " ", r["text"]).strip()[:500]
        prompt = f'Classify this request:\n"""{one_line}"""'
        mode = None
        try:
            mode = parse_label(ollama_chat(args.model, prompt, args.host))
        except (urllib.error.URLError, TimeoutError, OSError):
            pass
        with lock:
            stats["n"] += 1
            if mode is None:
                stats["fail"] += 1
            else:
                hint = r.get("hint")
                fh.write(
                    json.dumps(
                        {
                            "text": r["text"],
                            "mode": mode,
                            "source": r.get("source"),
                            "hint": hint,
                            "hint_agrees": (hint == mode) if hint else None,
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
                stats["ok"] += 1
            if stats["n"] % 250 == 0:
                fh.flush()
                print(
                    f"  {stats['n']}/{total} | labeled={stats['ok']} failed={stats['fail']}",
                    flush=True,
                )

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = [ex.submit(work, r) for r in todo]
        for _ in as_completed(futures):
            pass

    fh.close()
    print(f"\nLabeled {stats['ok']} (failed {stats['fail']}) -> {args.out}")


if __name__ == "__main__":
    main()
