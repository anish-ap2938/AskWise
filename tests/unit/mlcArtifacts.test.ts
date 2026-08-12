import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertMlcModelJson,
  mlcArtifactUrl,
} from "../../src/shared/mlcArtifacts";
import { askwiseFtModelUrl } from "../../src/shared/askwiseFtModel";

describe("MLC artifact URLs", () => {
  it("joins config filenames onto the HF resolve/main URL", () => {
    const base = askwiseFtModelUrl();
    expect(base).toMatch(/\/resolve\/main\/$/);
    expect(mlcArtifactUrl(base, "mlc-chat-config.json")).toBe(
      `${base}mlc-chat-config.json`
    );
    expect(mlcArtifactUrl(base, "tensor-cache.json")).toBe(
      `${base}tensor-cache.json`
    );
  });

  it("rejects HTML error pages instead of throwing a JSON parse error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "<!doctype html><html><body>Not Found</body></html>",
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(assertMlcModelJson(askwiseFtModelUrl())).rejects.toThrow(
      /web page instead of JSON/i
    );
    expect(fetchMock).toHaveBeenCalled();
  });

  it("accepts real JSON configs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ records: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(assertMlcModelJson(askwiseFtModelUrl())).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
