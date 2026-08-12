/**
 * WebLLM appConfig for every on-device model the extension can select.
 *
 * CreateMLCEngine(modelId) looks up `model_id` with == against this list and
 * throws ModelNotFoundError if it is missing. The AskWise FT repo is not in
 * WebLLM's prebuiltAppConfig, so we never pass that list through as-is.
 */

import type { AppConfig, ModelRecord } from "@mlc-ai/web-llm";
import {
  ASKWISE_FT_MODEL_ID,
  askwiseFtConfigured,
  askwiseFtModelUrl,
} from "./askwiseFtModel";
import { PACKAGED_MODEL_LIBS, packagedModelLibUrl } from "./modelLibs";
import { ONDEVICE_MODELS, type OnDeviceModelId } from "./ondeviceModel";

/** Stock MLC weight URLs (same ids WebLLM 0.2.84 ships). */
const STOCK_MODEL_URLS: Record<
  Exclude<OnDeviceModelId, typeof ASKWISE_FT_MODEL_ID>,
  string
> = {
  "Llama-3.2-1B-Instruct-q4f16_1-MLC":
    "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC",
  "Qwen2.5-1.5B-Instruct-q4f16_1-MLC":
    "https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
  "Qwen2.5-3B-Instruct-q4f16_1-MLC":
    "https://huggingface.co/mlc-ai/Qwen2.5-3B-Instruct-q4f16_1-MLC",
};

function modelWeightsUrl(id: OnDeviceModelId): string {
  if (id === ASKWISE_FT_MODEL_ID) return askwiseFtModelUrl();
  return STOCK_MODEL_URLS[id];
}

function modelRecord(id: OnDeviceModelId): ModelRecord {
  return {
    model: modelWeightsUrl(id),
    model_id: id,
    model_lib: packagedModelLibUrl(id),
    required_features: ["shader-f16"],
    overrides: {
      context_window_size: 4096,
    },
  };
}

/** AppConfig passed to CreateMLCEngine / hasModelInCache. */
export function buildOnDeviceAppConfig(): AppConfig {
  const model_list: ModelRecord[] = ONDEVICE_MODELS.map((spec) =>
    modelRecord(spec.id)
  );

  if (
    askwiseFtConfigured() &&
    !model_list.some((entry) => entry.model_id === ASKWISE_FT_MODEL_ID)
  ) {
    model_list.unshift(modelRecord(ASKWISE_FT_MODEL_ID));
  }

  return {
    model_list,
    // Cache API + HF /api/resolve-cache redirects trip CORS from extension
    // pages and can cache HTML error pages as JSON. IndexedDB uses fetch(),
    // which host_permissions allow.
    cacheBackend: "indexeddb",
  };
}

export function findOnDeviceModelRecord(
  modelId: string,
  appConfig: AppConfig = buildOnDeviceAppConfig()
): ModelRecord | undefined {
  return appConfig.model_list.find((entry) => entry.model_id === modelId);
}

/** Packaged wasm path for tests / logging (not the chrome-extension:// URL). */
export function packagedWasmRelPath(modelId: OnDeviceModelId): string {
  return PACKAGED_MODEL_LIBS[modelId];
}
