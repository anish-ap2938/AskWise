import { describe, expect, it } from "vitest";
import {
  ASKWISE_FT_HF_REPO,
  ASKWISE_FT_MODEL_ID,
  askwiseFtConfigured,
  askwiseFtModelUrl,
} from "../../src/shared/askwiseFtModel";
import { PACKAGED_MODEL_LIBS } from "../../src/shared/modelLibs";
import { ONDEVICE_MODELS } from "../../src/shared/ondeviceModel";

describe("AskWise fine-tune model wiring", () => {
  it("keeps FT model id mapped to a packaged wasm", () => {
    expect(PACKAGED_MODEL_LIBS[ASKWISE_FT_MODEL_ID]).toMatch(/\.wasm$/);
  });

  it("is not configured until the HF repo placeholder is replaced", () => {
    if (ASKWISE_FT_HF_REPO.startsWith("YOUR_HF_USER/")) {
      expect(askwiseFtConfigured()).toBe(false);
      expect(ONDEVICE_MODELS.some((m) => m.id === ASKWISE_FT_MODEL_ID)).toBe(
        false
      );
    } else {
      expect(askwiseFtConfigured()).toBe(true);
      expect(askwiseFtModelUrl()).toContain("huggingface.co");
      expect(askwiseFtModelUrl()).toMatch(/\/resolve\/main\/$/);
      expect(ONDEVICE_MODELS[0]?.id).toBe(ASKWISE_FT_MODEL_ID);
    }
  });
});
