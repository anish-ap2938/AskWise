/**
 * AskWise fine-tuned on-device model hosted on Hugging Face (MLC weights).
 *
 * After you train + convert + push (see training/README.md), set
 * ASKWISE_FT_HF_REPO to your public MLC repo id.
 *
 * Weights download from HF; WebGPU wasm is reused from the packaged
 * Qwen2.5-1.5B q4f16_1 library (same architecture + quantization).
 */

/** Edit this after `training/06_push_hf.sh` succeeds. */
export const ASKWISE_FT_HF_REPO =
  "YOUR_HF_USER/AskWise-PromptEngineer-1.5B-q4f16_1-MLC";

export const ASKWISE_FT_MODEL_ID =
  "AskWise-PromptEngineer-1.5B-q4f16_1-MLC" as const;

/** Packaged wasm key used for this FT model (must match architecture/quant). */
export const ASKWISE_FT_BASE_LIB_KEY =
  "Qwen2.5-1.5B-Instruct-q4f16_1-MLC" as const;

export function askwiseFtConfigured(): boolean {
  return !ASKWISE_FT_HF_REPO.startsWith("YOUR_HF_USER/");
}

export function askwiseFtModelUrl(): string {
  return `https://huggingface.co/${ASKWISE_FT_HF_REPO}/resolve/main/`;
}
