#!/usr/bin/env python3
"""Dry-check that the training/quantize stack is importable. Does NOT train."""

from __future__ import annotations


def main() -> None:
    print("AskWise training env check (no training started)\n")

    try:
        import torch

        print(f"torch: {torch.__version__}")
        print(f"cuda available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"gpu: {torch.cuda.get_device_name(0)}")
            props = torch.cuda.get_device_properties(0)
            print(f"vram: {props.total_memory / (1024**3):.1f} GB")
        else:
            print("WARNING: CUDA not visible — install a CUDA PyTorch wheel before training.")
    except Exception as e:
        print(f"torch: MISSING ({e})")

    for mod in ("transformers", "peft", "trl", "datasets", "yaml", "bitsandbytes"):
        try:
            m = __import__(mod)
            ver = getattr(m, "__version__", "ok")
            print(f"{mod}: {ver}")
        except Exception as e:
            print(f"{mod}: MISSING ({e})")

    print("\nMLC converter (needed for quantization step):")
    import shutil

    if shutil.which("mlc_llm"):
        print("mlc_llm: found on PATH")
    else:
        print("mlc_llm: NOT on PATH — install before 05_convert_mlc.sh")

    print("\nReady to train when CUDA + deps look good. Run steps in README.md yourself.")


if __name__ == "__main__":
    main()
