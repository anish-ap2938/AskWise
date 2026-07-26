# AskWise fine-tune → Hugging Face → Chrome extension

**You run every training / quantization step yourself.** Nothing here auto-starts fine-tuning.

Fine-tune a small instruct model on your **RTX 5070 Ti (16GB)** for AskWise Advanced rewrites, convert to **MLC**, host weights on **Hugging Face**, then point the extension at that repo.

Important: WebLLM cannot load a raw Transformers checkpoint. Users download **MLC-quantized weights**; the extension reuses the packaged **Qwen2.5-1.5B q4f16_1** WebGPU `.wasm` when you stay on that architecture/quantization.

## Recommended base (browser-friendly)

| Choice | Why |
|--------|-----|
| **Qwen2.5-1.5B-Instruct** (default) | Fits 16GB easily with QLoRA, fast in-browser, reuses existing AskWise wasm |
| Qwen2.5-3B-Instruct | Higher quality, larger download, needs its own wasm if not already packaged |
| Llama-3.2-1B-Instruct | Fastest; change `base_model` + MLC `--conv-template` + wasm mapping |

## One-time setup (Windows / Linux with NVIDIA)

```bash
# 1) CUDA PyTorch matching your driver (5070 Ti may need a recent CUDA 12.8+ wheel)
#    https://pytorch.org/get-started/locally/

cd training
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -U pip
pip install -r requirements.txt

# 2) MLC converter (separate env is fine)
pip install mlc-llm-nightly mlc-ai-nightly -f https://mlc.ai/wheels
# Follow: https://llm.mlc.ai/docs/install/mlc_llm.html

huggingface-cli login
```

Edit `config.yaml`:

```yaml
hf_repo: YOUR_HF_USER/AskWise-PromptEngineer-1.5B-q4f16_1-MLC
```

## Train + publish (run these yourself, in order)

From repo root, with the venv activated:

```bash
# 0) Optional: verify CUDA / deps (does not train)
python training/00_check_env.py

# A) Seed from Instant recipes/subrecipes (already generated once; safe to re-run)
npm run train:export-seed

# B) Augment (typo variants so the model learns spelling fixes)
python training/02_augment_dataset.py

# C) QLoRA SFT on GPU  ← this is the fine-tune; takes a while
python training/03_train_lora.py

# D) Merge adapter → full HF folder
python training/04_merge_lora.py

# E) Quantize / convert to MLC q4f16_1 for WebLLM
bash training/05_convert_mlc.sh

# F) Upload MLC folder to Hugging Face
bash training/06_push_hf.sh
```

Then in the extension source set your repo (see `src/shared/askwiseFtModel.ts`) and rebuild:

```bash
# edit ASKWISE_FT_HF_REPO
npm run build
```

Reload unpacked AskWise → Options → choose **AskWise fine-tuned 1.5B**.

## What “good” looks like

- Advanced returns in a few seconds after the model is cached
- Spelling fixed without a dictionary (`backery` → `bakery`)
- JSON `{"structured","advanced"}` only — never answers the user’s task
- Instant templates stay local (no model) for zero-latency Simple/Structured

## Dataset growth (optional)

Add more JSONL rows to `training/data/train_sft.jsonl` with the same chat shape:

```json
{"messages":[{"role":"system","content":"..."},{"role":"user","content":"..."},{"role":"assistant","content":"{\"structured\":\"...\",\"advanced\":\"...\"}"}]}
```

Hand-label 200–500 real messy prompts for the biggest quality jump.

## Wasm note

If you keep **Qwen2.5-1.5B + q4f16_1**, do **not** recompile wasm — AskWise already packages it.

Only run `mlc_llm compile … --device webgpu` if you change architecture or quantization, then put the new `.wasm` in `public/model-libs/` and map it in `src/shared/modelLibs.ts`.
