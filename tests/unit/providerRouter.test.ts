import { describe, it, expect, vi, beforeEach } from "vitest";
import { restoreRedactions } from "../../src/shared/redact";

describe("providerRouter redaction", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("restoreRedactions puts secrets back into rewrite", () => {
    const map = { "⟦REDACTED:api_key:1⟧": "sk-secret1234567890" };
    const text = "Use key ⟦REDACTED:api_key:1⟧ in the prompt";
    const restored = restoreRedactions(text, map);
    expect(restored).toContain("sk-secret1234567890");
  });

  it("redacted prompt should not contain raw secret in outbound body", async () => {
    const secret = "sk-abcdefghijklmnopqrstuvwxyz1234567890";
    const redacted = "my key ⟦REDACTED:openai_key:1⟧";
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"structured":"improved","advanced":"improved2"}' } }],
      }),
    } as Response);

    const { callLocalLlm } = await import("../../src/background/llm/local");
    await callLocalLlm(
      { local: { enabled: true, baseUrl: "http://localhost:11434", model: "qwen3:4b", lastDetected: null }, ladder: ["local"] },
      "system",
      redacted
    );

    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    const payload = JSON.stringify(body);
    expect(payload).not.toContain(secret);
    expect(payload).toContain("REDACTED");
  });
});
