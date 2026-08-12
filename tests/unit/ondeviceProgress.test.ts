import { describe, expect, it } from "vitest";
import {
  humanizeOnDeviceError,
  isDownloadStale,
  isHtmlAsJsonError,
  isReceivingEndError,
  looksLikeHtmlDocument,
} from "../../src/shared/ondeviceProgress";
import type { OnDeviceProgress } from "../../src/shared/ondeviceModel";
import { DEFAULT_ONDEVICE_MODEL } from "../../src/shared/ondeviceModel";

function progress(
  patch: Partial<OnDeviceProgress>
): OnDeviceProgress {
  return {
    status: "idle",
    model: DEFAULT_ONDEVICE_MODEL,
    progress: 0,
    text: "",
    updatedAt: 0,
    ...patch,
  };
}

describe("on-device error copy", () => {
  it("maps the MV3 receiving-end error to a retry hint", () => {
    const raw = "Could not establish connection. Receiving end does not exist.";
    expect(isReceivingEndError(raw)).toBe(true);
    expect(humanizeOnDeviceError(raw)).not.toMatch(/Receiving end/i);
    expect(humanizeOnDeviceError(raw)).toMatch(/Try again/i);
  });

  it("maps HTML-as-JSON parse failures to a Hugging Face hint", () => {
    const raw = `Unexpected token '<', "<!doctype "... is not valid JSON`;
    expect(isHtmlAsJsonError(raw)).toBe(true);
    expect(looksLikeHtmlDocument("<!doctype html><html>")).toBe(true);
    const copy = humanizeOnDeviceError(raw);
    expect(copy).not.toMatch(/<!doctype/i);
    expect(copy).not.toMatch(/Unexpected token/i);
    expect(copy).toMatch(/Hugging Face/i);
  });

  it("leaves WebGPU errors readable", () => {
    const raw =
      "WebGPU is unavailable. On-device AI needs Chrome 113+ with WebGPU enabled.";
    expect(humanizeOnDeviceError(raw)).toBe(raw);
  });

  it("treats a downloading status with a stale heartbeat as interrupted", () => {
    expect(
      isDownloadStale(
        progress({ status: "downloading", updatedAt: Date.now() - 120_000 }),
        Date.now()
      )
    ).toBe(true);
    expect(
      isDownloadStale(
        progress({ status: "downloading", updatedAt: Date.now() - 1_000 }),
        Date.now()
      )
    ).toBe(false);
  });
});
