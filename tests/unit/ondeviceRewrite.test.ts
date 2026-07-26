import { describe, it, expect } from "vitest";
import { restoreRedactions } from "../../src/shared/redact";
import { buildMetaPrompt } from "../../src/background/llm/metaPrompt";
import { tryParsePartial } from "../../src/background/llm/parseLlmJson";

describe("on-device rewrite prompt", () => {
  it("restores redactions in the generated rewrite", () => {
    const map = { "⟦REDACTED:api_key:1⟧": "sk-secret1234567890" };
    const text = "Use key ⟦REDACTED:api_key:1⟧ in the prompt";
    const restored = restoreRedactions(text, map);
    expect(restored).toContain("sk-secret1234567890");
  });

  it("sends only redacted text to the on-device model", () => {
    const secret = "sk-abcdefghijklmnopqrstuvwxyz1234567890";
    const redacted = "my key ⟦REDACTED:openai_key:1⟧";
    const messages = buildMetaPrompt("quick_improve", "chatgpt", redacted);
    expect(messages.user).not.toContain(secret);
    expect(messages.user).toContain("REDACTED");
  });

  it("asks for compact polish with spelling fixes and no invented tools", () => {
    const messages = buildMetaPrompt("app_builder", "claude", "bild me a wep app", {
      structured: "Build a web app",
      advanced: "Build a web app with a plan first",
    });
    expect(messages.system).toMatch(/fix spelling/i);
    expect(messages.system).toMatch(/Never invent/i);
    expect(messages.system).toMatch(/slash commands/i);
    expect(messages.system).toContain("110 words");
    expect(messages.user).toContain("build me a web app");
    expect(messages.user).not.toContain("bild me a wep app");
    expect(messages.user).toContain("structured_draft");
    expect(messages.user).toContain("Build a web app");
  });

  it("streams the Advanced field while JSON is still being generated", () => {
    const partial = tryParsePartial(
      '{"structured":"Clean prompt","advanced":"Build a polished prompt with'
    );
    expect(partial?.advanced).toBe("Build a polished prompt with");
  });
});
