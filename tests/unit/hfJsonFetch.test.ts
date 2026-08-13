import { describe, expect, it } from "vitest";
import {
  isAllowedHfFetchUrl,
  isHfJsonArtifactUrl,
} from "../../src/shared/hfJsonFetch";

describe("HF JSON fetch proxy", () => {
  it("matches Hugging Face JSON artifacts only", () => {
    expect(
      isHfJsonArtifactUrl(
        "https://huggingface.co/anipanii/AskWise-PromptEngineer-1.5B-q4f16_1-MLC/resolve/main/mlc-chat-config.json"
      )
    ).toBe(true);
    expect(
      isHfJsonArtifactUrl(
        "https://huggingface.co/anipanii/AskWise-PromptEngineer-1.5B-q4f16_1-MLC/resolve/main/params_shard_0.bin"
      )
    ).toBe(false);
    expect(
      isHfJsonArtifactUrl("chrome-extension://abc/mlc-models/askwise-ft/resolve/main/mlc-chat-config.json")
    ).toBe(false);
  });

  it("rejects non-HF hosts", () => {
    expect(isAllowedHfFetchUrl("https://evil.example/mlc-chat-config.json")).toBe(
      false
    );
    expect(
      isAllowedHfFetchUrl(
        "https://huggingface.co/anipanii/AskWise-PromptEngineer-1.5B-q4f16_1-MLC/resolve/main/mlc-chat-config.json"
      )
    ).toBe(true);
  });
});
