/** Browser-native WebLLM models that download into Cache Storage on first use. */

import {
  ASKWISE_FT_MODEL_ID,
  askwiseFtConfigured,
} from "./askwiseFtModel";

/**
 * `label` and `description` are shown to users in the options page, so they
 * describe the trade-off (download size, speed, quality) rather than the
 * training provenance.
 */
const BASE_MODELS = [
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    label: "Llama 3.2 1B",
    approxSizeGb: 0.7,
    description:
      "Smallest download and the quickest to answer. Pick this on an older laptop or a slow connection.",
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    label: "Qwen2.5 1.5B",
    approxSizeGb: 1.0,
    description: "General-purpose model. A middle ground between speed and rewrite quality.",
  },
  {
    id: "Qwen2.5-3B-Instruct-q4f16_1-MLC",
    label: "Qwen2.5 3B",
    approxSizeGb: 1.9,
    description:
      "Best rewrites of the general models, and the slowest to load and to generate.",
  },
] as const;

const FT_MODEL = {
  id: ASKWISE_FT_MODEL_ID,
  label: "AskWise 1.5B (recommended)",
  approxSizeGb: 1.0,
  description:
    "Trained specifically on prompt rewriting, so it follows the structure for each mode more closely than a general model of the same size.",
} as const;

export const ONDEVICE_MODELS = askwiseFtConfigured()
  ? ([FT_MODEL, ...BASE_MODELS] as const)
  : BASE_MODELS;

export type OnDeviceModelId =
  | (typeof BASE_MODELS)[number]["id"]
  | typeof ASKWISE_FT_MODEL_ID;

/** Prefer FT when configured; otherwise fast stock Llama. */
export const DEFAULT_ONDEVICE_MODEL: OnDeviceModelId = askwiseFtConfigured()
  ? ASKWISE_FT_MODEL_ID
  : "Llama-3.2-1B-Instruct-q4f16_1-MLC";

/** Older default; migrate existing installs to the fast model once. */
export const LEGACY_DEFAULT_ONDEVICE_MODEL: OnDeviceModelId =
  "Qwen2.5-3B-Instruct-q4f16_1-MLC";

/** Generation budget for Advanced JSON (structured + advanced). Shorter = much faster. */
export const ONDEVICE_MAX_TOKENS = 420;
export const ONDEVICE_TEMPERATURE = 0.1;

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

/**
 * Hugging Face / MLC CDNs used to download non-executable model weights.
 * Keep in sync with manifest.json host_permissions + content_security_policy.connect-src.
 */
export const ONDEVICE_CONNECT_ORIGINS = [
  "https://huggingface.co",
  "https://*.huggingface.co",
  "https://cdn-lfs.huggingface.co",
  "https://cdn-lfs-us-1.huggingface.co",
  "https://cdn-lfs.hf.co",
  "https://cdn-lfs-us-1.hf.co",
  "https://cdn-lfs-eu-1.hf.co",
  "https://cas-bridge.xethub.hf.co",
  "https://cas-server.xethub.hf.co",
  "https://cas-server.xethub-eu.hf.co",
  "https://transfer.xethub.hf.co",
  "https://transfer.xethub-eu.hf.co",
  "https://*.aws.cdn.hf.co",
  "https://*.gcp.cdn.hf.co",
] as const;
