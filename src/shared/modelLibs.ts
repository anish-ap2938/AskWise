import {
  ASKWISE_FT_BASE_LIB_KEY,
  ASKWISE_FT_MODEL_ID,
} from "./askwiseFtModel";
import type { OnDeviceModelId } from "./ondeviceModel";

/** Packaged WebGPU model libraries (not fetched from the network). */
export const PACKAGED_MODEL_LIBS: Record<OnDeviceModelId, string> = {
  "Qwen2.5-1.5B-Instruct-q4f16_1-MLC":
    "model-libs/Qwen2-1.5B-Instruct-q4f16_1_cs1k-webgpu.wasm",
  "Qwen2.5-3B-Instruct-q4f16_1-MLC":
    "model-libs/Qwen2.5-3B-Instruct-q4f16_1_cs1k-webgpu.wasm",
  "Llama-3.2-1B-Instruct-q4f16_1-MLC":
    "model-libs/Llama-3.2-1B-Instruct-q4f16_1_cs1k-webgpu.wasm",
  // Fine-tune reuses the Qwen2.5-1.5B q4f16_1 wasm (same arch + quant).
  [ASKWISE_FT_MODEL_ID]:
    ASKWISE_FT_BASE_LIB_KEY === "Qwen2.5-1.5B-Instruct-q4f16_1-MLC"
      ? "model-libs/Qwen2-1.5B-Instruct-q4f16_1_cs1k-webgpu.wasm"
      : "model-libs/Qwen2-1.5B-Instruct-q4f16_1_cs1k-webgpu.wasm",
};

export function packagedModelLibUrl(model: OnDeviceModelId): string {
  const rel = PACKAGED_MODEL_LIBS[model];
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(rel);
  }
  return rel;
}
