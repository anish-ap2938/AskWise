#!/usr/bin/env python3
"""Dry-check that the training stack is CUDA-ready. Does NOT train."""

from __future__ import annotations


def main() -> None:
    print("AskWise training env check (no training started)\n")

    try:
        import torch

        print(f"torch: {torch.__version__}")
        print(f"cuda available: {torch.cuda.is_available()}")
        print(f"cuda runtime: {torch.version.cuda}")
        if torch.cuda.is_available():
            print(f"gpu: {torch.cuda.get_device_name(0)}")
            props = torch.cuda.get_device_properties(0)
            print(f"vram: {props.total_memory / (1024**3):.1f} GB")
            try:
                x = torch.randn(256, 256, device="cuda")
                y = x @ x
                torch.cuda.synchronize()
                print(f"cuda matmul ok: {tuple(y.shape)}")
                del x, y
                torch.cuda.empty_cache()
            except Exception as e:
                print(f"CUDA KERNEL FAIL: {e}")
                print(
                    "Install Blackwell-capable wheel, e.g.\n"
                    "  pip install torch --index-url https://download.pytorch.org/whl/cu128"
                )
        else:
            print("WARNING: CUDA not visible — training will refuse to start.")
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
        print("mlc_llm: NOT on PATH — install before 05_convert_mlc")

    print("\nReady when CUDA matmul ok + deps listed. See training/README.md.")


if __name__ == "__main__":
    main()
