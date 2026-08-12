#!/usr/bin/env python3
"""
Train the AskWise intent classifier and export it for in-browser inference.

Input:  training/data/raw/labeled.jsonl   (from 11_autolabel_modes.py)
Eval:   tests/fixtures/prompts.json       (hand-labeled, NEVER trained on)
Output: public/assets/intent-model.json   (quantized linear model)

Run:
    python training/12_train_intent_clf.py
"""

from __future__ import annotations

import argparse
import base64
import json
import random
import re
from collections import Counter
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

from lib_features import analyze

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
RAW = ROOT / "data" / "raw"

# Sources whose label is reliable by construction; the LLM sometimes reads these
# as trivia because the table context isn't shown to it.
TRUSTED_SOURCE_LABEL = {"sql_context": "data_analysis"}

TYPO_SWAPS = [
    ("the", "teh"), ("and", "adn"), ("you", "u"), ("your", "ur"),
    ("with", "wiht"), ("for", "fro"), ("that", "taht"), ("this", "tihs"),
    ("what", "waht"), ("want", "wnat"), ("need", "ned"), ("make", "mak"),
    ("write", "wirte"), ("help", "hlep"), ("please", "plz"), ("because", "becuase"),
    ("really", "realy"), ("should", "shoud"), ("would", "woudl"), ("about", "abot"),
]


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        raise SystemExit(f"missing {path}")
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return rows


def messy(text: str, rng: random.Random) -> str:
    """Simulate how people actually type into a chat composer."""
    out = text
    for a, b in TYPO_SWAPS:
        if rng.random() < 0.5:
            out = re.sub(rf"\b{a}\b", b, out, flags=re.I)
    if rng.random() < 0.6:
        out = out.lower()
    if rng.random() < 0.5:
        out = re.sub(r"[.,;!]", "", out)
    if rng.random() < 0.3:
        out = out.replace("?", "")
    if rng.random() < 0.25:
        words = out.split()
        if len(words) > 6:
            out = " ".join(words[: max(5, int(len(words) * 0.7))])
    return out.strip()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--labeled", type=Path, default=RAW / "labeled.jsonl")
    ap.add_argument("--synth", type=Path, default=RAW / "synth.jsonl")
    ap.add_argument("--out", type=Path, default=REPO / "public" / "assets" / "intent-model.json")
    ap.add_argument("--max-per-class", type=int, default=4500)
    ap.add_argument("--min-per-class", type=int, default=40)
    ap.add_argument("--max-features", type=int, default=20000)
    ap.add_argument("--min-df", type=int, default=3)
    ap.add_argument("--messy-copies", type=int, default=1)
    ap.add_argument("--C", type=float, default=4.0)
    ap.add_argument("--seed", type=int, default=0)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    rows = load_jsonl(args.labeled)
    n_real = len(rows)
    if args.synth.exists():
        rows += load_jsonl(args.synth)
    print(f"rows: {n_real} real + {len(rows) - n_real} synthetic = {len(rows)}")

    # Dedupe across sources, then cap per class so the Q&A-heavy corpora don't
    # drown out the modes that matter most to AskWise.
    seen: set[str] = set()
    by_mode: dict[str, list[str]] = {}
    for r in rows:
        mode = TRUSTED_SOURCE_LABEL.get(str(r.get("source")), r["mode"])
        key = re.sub(r"\s+", " ", r["text"].lower()).strip()
        if key in seen:
            continue
        seen.add(key)
        by_mode.setdefault(mode, []).append(r["text"])

    texts: list[str] = []
    labels: list[str] = []
    print("\nclass balance:")
    for mode in sorted(by_mode, key=lambda m: -len(by_mode[m])):
        pool = by_mode[mode]
        if len(pool) < args.min_per_class:
            print(f"  {mode:15} {len(pool):5} DROPPED (below --min-per-class)")
            continue
        rng.shuffle(pool)
        kept = pool[: args.max_per_class]
        texts.extend(kept)
        labels.extend([mode] * len(kept))
        capped = " (capped)" if len(kept) < len(pool) else ""
        print(f"  {mode:15} {len(kept):5} of {len(pool)}{capped}")

    missing = set(Counter(labels)) ^ {
        "simple_answer", "research", "app_builder", "coding_debug", "agent_task",
        "resume_job", "writing", "data_analysis", "quick_improve",
    }
    if missing:
        print(f"\n  WARNING: modes absent from training data: {sorted(missing)}")

    X_tr, X_te, y_tr, y_te = train_test_split(
        texts, labels, test_size=0.12, random_state=args.seed, stratify=labels
    )

    # Messy variants only on the training half, so the held-out split stays honest.
    aug_x, aug_y = list(X_tr), list(y_tr)
    for _ in range(args.messy_copies):
        for t, y in zip(X_tr, y_tr):
            m = messy(t, rng)
            if m and m.lower() != t.lower():
                aug_x.append(m)
                aug_y.append(y)
    print(f"train rows after messy augmentation: {len(aug_x)}")

    vec = TfidfVectorizer(
        analyzer=analyze,
        max_features=args.max_features,
        min_df=args.min_df,
        sublinear_tf=True,
        norm="l2",
        smooth_idf=True,
        dtype=np.float32,
    )
    Xtr = vec.fit_transform(aug_x)
    print(f"features: {Xtr.shape[1]}")

    clf = LogisticRegression(
        C=args.C,
        max_iter=3000,
        class_weight="balanced",
        n_jobs=-1,
    )
    clf.fit(Xtr, aug_y)

    print("\n=== held-out split (LLM labels) ===")
    print(classification_report(y_te, clf.predict(vec.transform(X_te)), zero_division=0))

    # --- honest eval: hand-labeled fixtures, never seen in training ---
    fx = json.loads((REPO / "tests" / "fixtures" / "prompts.json").read_text(encoding="utf-8"))
    fixtures = fx["fixtures"]
    fx_texts = [f["text"] for f in fixtures]
    fx_pred = clf.predict(vec.transform(fx_texts))
    gated = [(f, p) for f, p in zip(fixtures, fx_pred) if not f.get("stretch")]
    stretch = [(f, p) for f, p in zip(fixtures, fx_pred) if f.get("stretch")]
    g_ok = sum(1 for f, p in gated if p == f["expected"])
    s_ok = sum(1 for f, p in stretch if p == f["expected"])
    print("=== fixtures (ML only, never trained on) ===")
    print(f"gated:   {g_ok}/{len(gated)} ({g_ok / len(gated):.1%})")
    if stretch:
        print(f"stretch: {s_ok}/{len(stretch)} ({s_ok / len(stretch):.1%})")

    # --- export quantized model ---
    classes = list(clf.classes_)
    vocab = vec.vocabulary_
    tokens = [""] * len(vocab)
    for tok, idx in vocab.items():
        tokens[idx] = tok
    idf = vec.idf_.astype(np.float32)
    coef = clf.coef_.astype(np.float32)  # (n_classes, n_features)

    scale = float(np.abs(coef).max()) / 127.0
    q = np.clip(np.round(coef / scale), -127, 127).astype(np.int8)

    model = {
        "version": 1,
        "classes": classes,
        "tokens": tokens,
        "idf": [round(float(v), 4) for v in idf],
        "coefScale": scale,
        "coefB64": base64.b64encode(q.tobytes()).decode("ascii"),
        "intercept": [float(v) for v in clf.intercept_],
        "sublinearTf": True,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(model), encoding="utf-8")
    size_kb = args.out.stat().st_size / 1024
    print(f"\nexported {args.out} ({size_kb:.0f} KB, {len(tokens)} features, {len(classes)} classes)")

    # Parity fixture for the TS side: scores from the SAME int8 weights the
    # browser loads (not the unquantized sklearn decision_function).
    probe = [
        "my react app wont update state after fetch",
        "i need a saas for dog walkers",
        "tailor my resume for a data analyst role",
        "which year holds rank 2?",
        "explain how dns works",
    ]
    coef_q = q.astype(np.float64) * scale
    X = vec.transform(probe)
    P = X @ coef_q.T + np.asarray(clf.intercept_, dtype=np.float64)
    (ROOT / "data" / "raw" / "parity_probe.json").write_text(
        json.dumps(
            {
                "classes": classes,
                "cases": [
                    {"text": t, "scores": [round(float(v), 5) for v in row]}
                    for t, row in zip(probe, np.asarray(P))
                ],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print("wrote data/raw/parity_probe.json for the TS parity test")


if __name__ == "__main__":
    main()
