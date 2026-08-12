#!/usr/bin/env python3
"""QLoRA / LoRA SFT for AskWise prompt-rewrite model — requires NVIDIA CUDA GPU."""

from __future__ import annotations

import argparse
import json
import os
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


def require_cuda() -> None:
    if not torch.cuda.is_available():
        raise SystemExit(
            "CUDA GPU required for training. Install a CUDA PyTorch wheel "
            "(RTX 50-series: pip install torch --index-url "
            "https://download.pytorch.org/whl/cu128) then re-run 00_check_env.py."
        )
    # Force single visible GPU unless user already set CUDA_VISIBLE_DEVICES
    os.environ.setdefault("CUDA_VISIBLE_DEVICES", "0")
    props = torch.cuda.get_device_properties(0)
    print(
        f"GPU: {torch.cuda.get_device_name(0)} | "
        f"VRAM {props.total_memory / (1024**3):.1f} GB | "
        f"torch {torch.__version__} | cuda {torch.version.cuda}"
    )
    # Smoke kernel (catches CPU-only or wrong arch wheels early)
    x = torch.zeros(1, device="cuda")
    del x
    torch.cuda.empty_cache()


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

    require_cuda()

    train_path = args.train or (ROOT / cfg["train_jsonl"])
    rows = load_rows(train_path)
    if not rows:
        raise SystemExit(f"No training rows in {train_path}. Run export + dataset build + augment first.")

    model_id = cfg["base_model"]
    print(f"Loading {model_id} with {len(rows)} examples …")
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
        dtype=torch.bfloat16 if cfg.get("bf16", True) else torch.float16,
        attn_implementation="sdpa",
    )
    if quant is not None:
        model = prepare_model_for_kbit_training(model)
    if hasattr(model, "enable_input_require_grads"):
        model.enable_input_require_grads()

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
        logging_steps=5,
        save_strategy="epoch",
        bf16=bool(cfg.get("bf16", True)),
        fp16=not bool(cfg.get("bf16", True)),
        optim="paged_adamw_8bit" if quant is not None else "adamw_torch",
        report_to="none",
        remove_unused_columns=False,
        dataloader_pin_memory=True,
        gradient_checkpointing=True,
    )

    trainer_kwargs = dict(
        model=model,
        args=targs,
        train_dataset=ds,
    )
    try:
        trainer = SFTTrainer(
            **trainer_kwargs,
            processing_class=tokenizer,
            dataset_text_field="text",
            max_seq_length=int(cfg["max_seq_len"]),
        )
    except TypeError:
        try:
            trainer = SFTTrainer(
                **trainer_kwargs,
                tokenizer=tokenizer,
                dataset_text_field="text",
                max_seq_length=int(cfg["max_seq_len"]),
            )
        except TypeError:
            # Newer TRL: SFTConfig / formatting via dataset only
            from trl import SFTConfig

            sft_args = SFTConfig(
                output_dir=str(out_dir),
                num_train_epochs=float(cfg["num_train_epochs"]),
                per_device_train_batch_size=int(cfg["per_device_train_batch_size"]),
                gradient_accumulation_steps=int(cfg["gradient_accumulation_steps"]),
                learning_rate=float(cfg["learning_rate"]),
                warmup_ratio=float(cfg["warmup_ratio"]),
                weight_decay=float(cfg["weight_decay"]),
                logging_steps=5,
                save_strategy="epoch",
                bf16=bool(cfg.get("bf16", True)),
                fp16=not bool(cfg.get("bf16", True)),
                optim="paged_adamw_8bit" if quant is not None else "adamw_torch",
                report_to="none",
                max_length=int(cfg["max_seq_len"]),
                dataset_text_field="text",
                gradient_checkpointing=True,
            )
            trainer = SFTTrainer(
                model=model,
                args=sft_args,
                train_dataset=ds,
                processing_class=tokenizer,
            )

    trainer.train()
    trainer.save_model(str(out_dir))
    tokenizer.save_pretrained(str(out_dir))
    print(f"Saved LoRA adapter -> {out_dir}")
    print(f"Peak VRAM allocated: {torch.cuda.max_memory_allocated() / (1024**3):.2f} GB")


if __name__ == "__main__":
    main()
