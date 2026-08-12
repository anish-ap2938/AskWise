import { describe, expect, it } from "vitest";
import {
  ASKWISE_FT_MODEL_ID,
  askwiseFtConfigured,
  askwiseFtModelUrl,
} from "../../src/shared/askwiseFtModel";
import {
  buildOnDeviceAppConfig,
  findOnDeviceModelRecord,
  packagedWasmRelPath,
} from "../../src/shared/mlcAppConfig";
import { ONDEVICE_MODELS } from "../../src/shared/ondeviceModel";

describe("on-device WebLLM appConfig", () => {
  it("lists every selectable model_id exactly once", () => {
    const { model_list } = buildOnDeviceAppConfig();
    const ids = model_list.map((entry) => entry.model_id);
    expect(ids).toEqual(ONDEVICE_MODELS.map((m) => m.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("registers the AskWise FT model_id CreateMLCEngine will request", () => {
    if (!askwiseFtConfigured()) return;
    const record = findOnDeviceModelRecord(ASKWISE_FT_MODEL_ID);
    expect(record).toBeDefined();
    expect(record?.model_id).toBe(ASKWISE_FT_MODEL_ID);
    expect(record?.model).toBe(askwiseFtModelUrl());
    expect(record?.model_lib).toContain(
      packagedWasmRelPath(ASKWISE_FT_MODEL_ID)
    );
    expect(packagedWasmRelPath(ASKWISE_FT_MODEL_ID)).toBe(
      "model-libs/Qwen2-1.5B-Instruct-q4f16_1_cs1k-webgpu.wasm"
    );
  });

  it("uses IndexedDB so HF redirects are fetched instead of Cache API", () => {
    expect(buildOnDeviceAppConfig().cacheBackend).toBe("indexeddb");
  });
});
