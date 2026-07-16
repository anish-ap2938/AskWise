import { describe, expect, it } from "vitest";
import {
  buildRefineMessages,
  parseRefineContent,
} from "../../src/background/llm/refinePrompt";

describe("parseRefineContent", () => {
  it("parses a full JSON refine payload", () => {
    const result = parseRefineContent(
      JSON.stringify({
        reply: "Added acceptance criteria.",
        prompt: "You are a coach.\n\nTask: …",
      })
    );
    expect(result.reply).toBe("Added acceptance criteria.");
    expect(result.prompt).toContain("You are a coach");
  });

  it("allows null prompt when only asking a question", () => {
    const result = parseRefineContent(
      '{"reply":"What platform are you targeting?","prompt":null}'
    );
    expect(result.reply).toContain("platform");
    expect(result.prompt).toBeNull();
  });

  it("recovers from fenced JSON", () => {
    const result = parseRefineContent(
      '```json\n{"reply":"Shorter now.","prompt":"Be brief."}\n```'
    );
    expect(result.reply).toBe("Shorter now.");
    expect(result.prompt).toBe("Be brief.");
  });
});

describe("buildRefineMessages", () => {
  it("includes the current prompt and user turn", () => {
    const { system, user } = buildRefineMessages(
      "Draft prompt here",
      [{ role: "assistant", content: "What stack?" }],
      "React + Node"
    );
    expect(system).toContain("prompt coach");
    expect(user).toContain("Draft prompt here");
    expect(user).toContain("React + Node");
    expect(user).toContain("ASSISTANT: What stack?");
  });
});
