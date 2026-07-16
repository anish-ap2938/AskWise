/** Browser-native WebLLM models that download into Cache Storage on first use. */

export const ONDEVICE_MODELS = [
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    label: "Qwen2.5 1.5B (recommended)",
    approxSizeGb: 1.0,
    description: "Best balance of speed and rewrite quality for most laptops.",
  },
  {
    id: "Qwen2.5-3B-Instruct-q4f16_1-MLC",
    label: "Qwen2.5 3B (higher quality)",
    approxSizeGb: 1.9,
    description: "Closer to Ollama-class rewrites; needs more VRAM/RAM.",
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    label: "Llama 3.2 1B (fastest)",
    approxSizeGb: 0.7,
    description: "Smallest download — use on weaker devices.",
  },
] as const;

export type OnDeviceModelId = (typeof ONDEVICE_MODELS)[number]["id"];

export const DEFAULT_ONDEVICE_MODEL: OnDeviceModelId =
  "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

export type OnDeviceStatus =
  | "idle"
  | "unsupported"
  | "downloading"
  | "ready"
  | "error";

export interface OnDeviceProgress {
  status: OnDeviceStatus;
  model: OnDeviceModelId;
  progress: number;
  text: string;
  error?: string;
  updatedAt: number;
}

export const DEFAULT_ONDEVICE_PROGRESS: OnDeviceProgress = {
  status: "idle",
  model: DEFAULT_ONDEVICE_MODEL,
  progress: 0,
  text: "",
  updatedAt: 0,
};

/** Hugging Face / MLC CDNs WebLLM fetches weights and WASM libs from. */
export const ONDEVICE_CONNECT_ORIGINS = [
  "https://huggingface.co",
  "https://*.huggingface.co",
  "https://cdn-lfs.huggingface.co",
  "https://cdn-lfs-us-1.huggingface.co",
  "https://cdn-lfs-us-1.hf.co",
  "https://cas-bridge.xethub.hf.co",
  "https://raw.githubusercontent.com",
] as const;
