import { afterEach, describe, expect, it, vi } from "vitest";
import { sendToBackground } from "../../src/shared/runtimeMessage";

describe("sendToBackground", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("retries when the service worker receiving end is missing", async () => {
    let calls = 0;
    const sendMessage = vi.fn((_msg: unknown, cb: (r: unknown) => void) => {
      calls += 1;
      if (calls < 3) {
        (globalThis as { chrome: { runtime: { lastError?: { message: string } } } }).chrome.runtime.lastError =
          { message: "Could not establish connection. Receiving end does not exist." };
        cb(undefined);
        return;
      }
      (globalThis as { chrome: { runtime: { lastError?: { message: string } } } }).chrome.runtime.lastError =
        undefined;
      cb({ kind: "ONDEVICE_STATUS", payload: { status: "downloading" } });
    });

    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage,
        lastError: undefined as { message: string } | undefined,
      },
    });

    const result = await sendToBackground(
      { kind: "ENSURE_ONDEVICE" },
      { retries: 4, retryDelayMs: 5 }
    );
    expect(result).toEqual({
      kind: "ONDEVICE_STATUS",
      payload: { status: "downloading" },
    });
    expect(calls).toBe(3);
  });

  it("does not surface the raw Chrome receiving-end error", async () => {
    const sendMessage = vi.fn((_msg: unknown, cb: (r: unknown) => void) => {
      (globalThis as { chrome: { runtime: { lastError?: { message: string } } } }).chrome.runtime.lastError =
        { message: "Could not establish connection. Receiving end does not exist." };
      cb(undefined);
    });
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage,
        lastError: undefined as { message: string } | undefined,
      },
    });

    await expect(
      sendToBackground({ kind: "ENSURE_ONDEVICE" }, { retries: 1, retryDelayMs: 1 })
    ).rejects.toThrow(/Try again/i);
  });
});
