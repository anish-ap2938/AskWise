#!/usr/bin/env python3
"""Merge LoRA adapter into full HF weights (GPU when available)."""

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
    ap.add_argument("--cpu", action="store_true", help="force CPU merge")
    args = ap.parse_args()
    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))

    base = cfg["base_model"]
    adapter = ROOT / cfg["adapter_dir"]
    out = ROOT / cfg["merged_dir"]
    out.mkdir(parents=True, exist_ok=True)

    use_cuda = torch.cuda.is_available() and not args.cpu
    device_map = "auto" if use_cuda else "cpu"
    dtype = torch.bfloat16 if use_cuda else torch.float32
    print(
        f"Loading base {base} on {'GPU ' + torch.cuda.get_device_name(0) if use_cuda else 'CPU'} …"
    )
    model = AutoModelForCausalLM.from_pretrained(
        base,
        torch_dtype=dtype,
        device_map=device_map,
    )
    print(f"Loading adapter {adapter} …")
    model = PeftModel.from_pretrained(model, str(adapter))
    model = model.merge_and_unload()

    # Save from CPU for safer serialization / MLC tools
    if use_cuda:
        model = model.to("cpu")
        torch.cuda.empty_cache()

    tokenizer = AutoTokenizer.from_pretrained(base, use_fast=True)
    model.save_pretrained(str(out), safe_serialization=True)
    tokenizer.save_pretrained(str(out))
    # Newer transformers nest rope_theta under rope_parameters; MLC gen_config
    # still expects a top-level rope_theta for Qwen2.
    cfg_path = out / "config.json"
    import json

    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    if "rope_theta" not in cfg:
        nested = (cfg.get("rope_parameters") or {}).get("rope_theta")
        cfg["rope_theta"] = float(nested) if nested is not None else 1000000.0
        cfg_path.write_text(json.dumps(cfg, indent=2) + "\n", encoding="utf-8")
        print(f"Patched config.json with rope_theta={cfg['rope_theta']}")
    print(f"Merged HF model -> {out}")
    print("Next: run 05_convert_mlc (bash or .ps1) then push the MLC folder to Hugging Face.")


if __name__ == "__main__":
    main()
