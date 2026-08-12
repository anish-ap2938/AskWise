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
# 1) CUDA PyTorch for RTX 50-series (Blackwell / sm_120) — cu128+ required
cd training
# Prefer Python 3.12 on Windows
py -3.12 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -U pip
pip install torch --index-url https://download.pytorch.org/whl/cu128
pip install -r requirements.txt
python 00_check_env.py      # must show cuda matmul ok

# 2) MLC converter (for step E only; separate env is fine)
pip install mlc-llm-nightly mlc-ai-nightly -f https://mlc.ai/wheels
# Follow: https://llm.mlc.ai/docs/install/mlc_llm.html

huggingface-cli login
```

Edit `config.yaml`:

```yaml
hf_repo: YOUR_HF_USER/AskWise-PromptEngineer-1.5B-q4f16_1-MLC
```

## Intent classifier pipeline (steps 10–14)

Separate from the fine-tune. This trains the **mode classifier** that ships inside
the extension as `public/assets/intent-model.json` — a quantized logistic
regression over tf-idf features, loaded lazily by the content script and blended
with the keyword rules in `src/shared/classify.ts`.

Requires a local **Ollama** server (`qwen3:8b`) for labeling and generation:

```bash
# Give the server real parallelism — this is worth ~3x throughput
OLLAMA_NUM_PARALLEL=8 OLLAMA_KEEP_ALIVE=2h ollama serve
```

```bash
# 10) Download open prompt corpora -> data/raw/pool.jsonl (~33k real human asks)
npm run train:corpora

# 11) Label them into AskWise modes with the local judge model (resumable)
npm run train:label -- --limit 40000 --workers 5

# 12) Train + export the classifier, and report accuracy on the hand-labeled
#     fixtures it never sees during training
npm run train:intent

# 13) Public corpora are overwhelmingly Q&A, so synthesize the missing modes
#     (agent_task, resume_job, app_builder, coding_debug) and screen each batch
npm run train:synth -- --workers 5 --scale 0.65

# then re-run 12, and pick blend constants for src/shared/classify.ts:
npm run train:tune-hybrid
```

Two things matter more than dataset size here:

1. **Taxonomy alignment.** The judge model's definitions *are* the labels. Run
   `python training/bench_taxonomy.py` after editing `TAXONOMY` in `lib_label.py`
   — it scores the judge against AskWise's own fixtures. Anything below ~95%
   means the classifier is being taught to fight the product spec.
2. **Feature parity.** `training/lib_features.py` and `src/shared/intentFeatures.ts`
   must stay identical, or in-browser scores drift from the trained model.
   `tests/unit/intentModel.test.ts` asserts TS output matches scikit-learn.

Run these workloads **one at a time**. Labeling and generation use different long
system prompts, so interleaving them evicts Ollama's prefix cache and both slow to
a crawl.

## Train + publish (run these yourself, in order)

From repo root, with the venv activated:

```bash
# 0) Verify CUDA / deps (does not train)
python training/00_check_env.py

# A) Seed from Instant recipes/subrecipes
npm run train:export-seed

# B) Build prompt-engineering dataset (synthetic + HF corpora)
#    Optional GPU teacher polish: add --teacher-gpu 100
python training/01_build_prompt_dataset.py

# B2) Preferred: teacher-polished SFT data from the labeled corpus.
#     Uses the *exact* system/user strings the extension builds at runtime, so
#     the student never sees a prompt shape it won't get in production.
npm run train:sft-pool      # balanced raw prompts, some deliberately messy
npm run train:sft-drafts    # attach Instant drafts + real runtime prompt
npm run train:sft-teacher   # qwen3:8b writes + validates the gold targets

# C) Augment (typo variants so the model learns spelling fixes)
python training/02_augment_dataset.py

# D) QLoRA SFT on GPU  ← refuses to run without CUDA
python training/03_train_lora.py

# E) Merge adapter → full HF folder (uses GPU when available)
python training/04_merge_lora.py

# F) Quantize / convert to MLC q4f16_1 for WebLLM
bash training/05_convert_mlc.sh          # or: pwsh training/05_convert_mlc.ps1

# G) Upload MLC folder to Hugging Face (edit hf_repo in config.yaml first)
bash training/06_push_hf.sh              # or: pwsh training/06_push_hf.ps1
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

Avoid using the Instant draft verbatim as the assistant target — that only teaches
the model to echo the deterministic rewriter. `15_build_sft_teacher.py` exists so
targets are strictly better than the draft, and it rejects any completion that
answers the task, drifts off topic, or blows the word budget.

## Wasm note

If you keep **Qwen2.5-1.5B + q4f16_1**, do **not** recompile wasm — AskWise already packages it.

Only run `mlc_llm compile … --device webgpu` if you change architecture or quantization, then put the new `.wasm` in `public/model-libs/` and map it in `src/shared/modelLibs.ts`.
