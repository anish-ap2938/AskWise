#!/usr/bin/env python3
"""Merge LoRA adapter into full HF weights for MLC conversion."""

from __future__ import annotations

import argparse
from pathlib import Path

import torch
import yaml
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

ROOT = Path(__file__).resolve().parent


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", type=Path, default=ROOT / "config.yaml")
    args = ap.parse_args()
    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))

    base = cfg["base_model"]
    adapter = ROOT / cfg["adapter_dir"]
    out = ROOT / cfg["merged_dir"]
    out.mkdir(parents=True, exist_ok=True)

    print(f"Loading base {base} …")
    model = AutoModelForCausalLM.from_pretrained(
        base,
        torch_dtype=torch.bfloat16,
        device_map="cpu",
    )
    print(f"Loading adapter {adapter} …")
    model = PeftModel.from_pretrained(model, str(adapter))
    model = model.merge_and_unload()

    tokenizer = AutoTokenizer.from_pretrained(base, use_fast=True)
    model.save_pretrained(str(out), safe_serialization=True)
    tokenizer.save_pretrained(str(out))
    print(f"Merged HF model → {out}")
    print("Next: run 05_convert_mlc.sh then push the MLC folder to Hugging Face.")


if __name__ == "__main__":
    main()
