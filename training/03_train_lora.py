#!/usr/bin/env python3
"""QLoRA / LoRA SFT for AskWise prompt-rewrite model (16GB VRAM friendly)."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import torch
import yaml
from datasets import Dataset
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from trl import SFTTrainer

ROOT = Path(__file__).resolve().parent


def load_config(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def load_rows(path: Path) -> list[dict]:
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def format_example(tokenizer, messages: list[dict]) -> str:
    return tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=False,
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", type=Path, default=ROOT / "config.yaml")
    ap.add_argument("--train", type=Path, default=None)
    args = ap.parse_args()
    cfg = load_config(args.config)

    train_path = args.train or (ROOT / cfg["train_jsonl"])
    rows = load_rows(train_path)
    if not rows:
        raise SystemExit(f"No training rows in {train_path}. Run export + augment first.")

    model_id = cfg["base_model"]
    tokenizer = AutoTokenizer.from_pretrained(model_id, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    texts = [format_example(tokenizer, r["messages"]) for r in rows]
    ds = Dataset.from_dict({"text": texts})

    quant = None
    if cfg.get("load_in_4bit", True):
        quant = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
            bnb_4bit_compute_dtype=torch.bfloat16
            if cfg.get("bf16", True)
            else torch.float16,
        )

    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=quant,
        device_map="auto",
        torch_dtype=torch.bfloat16 if cfg.get("bf16", True) else torch.float16,
        attn_implementation="sdpa",
    )
    if quant is not None:
        model = prepare_model_for_kbit_training(model)

    lora = LoraConfig(
        r=int(cfg["lora_r"]),
        lora_alpha=int(cfg["lora_alpha"]),
        lora_dropout=float(cfg["lora_dropout"]),
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=[
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj",
        ],
    )
    model = get_peft_model(model, lora)
    model.print_trainable_parameters()

    out_dir = ROOT / cfg["adapter_dir"]
    out_dir.mkdir(parents=True, exist_ok=True)

    targs = TrainingArguments(
        output_dir=str(out_dir),
        num_train_epochs=float(cfg["num_train_epochs"]),
        per_device_train_batch_size=int(cfg["per_device_train_batch_size"]),
        gradient_accumulation_steps=int(cfg["gradient_accumulation_steps"]),
        learning_rate=float(cfg["learning_rate"]),
        warmup_ratio=float(cfg["warmup_ratio"]),
        weight_decay=float(cfg["weight_decay"]),
        logging_steps=10,
        save_strategy="epoch",
        bf16=bool(cfg.get("bf16", True)),
        fp16=not bool(cfg.get("bf16", True)),
        optim="paged_adamw_8bit" if quant is not None else "adamw_torch",
        report_to="none",
        remove_unused_columns=False,
    )

    trainer_kwargs = dict(
        model=model,
        args=targs,
        train_dataset=ds,
    )
    # TRL API shifted across versions — prefer the modern kwargs, fall back.
    try:
        trainer = SFTTrainer(
            **trainer_kwargs,
            processing_class=tokenizer,
            dataset_text_field="text",
            max_seq_length=int(cfg["max_seq_len"]),
        )
    except TypeError:
        trainer = SFTTrainer(
            **trainer_kwargs,
            tokenizer=tokenizer,
            dataset_text_field="text",
            max_seq_length=int(cfg["max_seq_len"]),
        )
    trainer.train()
    trainer.save_model(str(out_dir))
    tokenizer.save_pretrained(str(out_dir))
    print(f"Saved LoRA adapter → {out_dir}")


if __name__ == "__main__":
    main()
