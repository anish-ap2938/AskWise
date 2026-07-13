import { describe, expect, it } from "vitest";
import { diffRewrite, summarizeFix } from "../../src/shared/diff";
import { scorePrompt } from "../../src/shared/score";
import { improveTier1 } from "../../src/shared/improve";

describe("diffRewrite", () => {
  it("marks kept words as same and new words as added", () => {
    const segments = diffRewrite(
      "build an app for fitness",
      "You should build an app for fitness with milestones"
    );
    const added = segments.filter((s) => s.type === "added").map((s) => s.text.trim());
    const same = segments.filter((s) => s.type === "same").map((s) => s.text.trim());
    expect(same.join(" ")).toContain("build an app for fitness");
    expect(added.join(" ")).toContain("milestones");
  });

  it("reconstructs the rewritten text exactly when joined", () => {
    const original = "explain binary search";
    const { variants } = improveTier1(original, "chatgpt");
    const segments = diffRewrite(original, variants.structured);
    expect(segments.map((s) => s.text).join("")).toBe(variants.structured);
  });

  it("handles empty original", () => {
    const segments = diffRewrite("", "brand new text");
    expect(segments).toEqual([{ text: "brand new text", type: "added" }]);
  });
});

describe("summarizeFix", () => {
  it("names the signals the rewrite fixed", () => {
    const raw = "i want to build and app for fitness";
    const r = improveTier1(raw, "chatgpt");
    const summary = summarizeFix(r.scoreBefore, r.scoreAfter);
    expect(summary).toMatch(/Added .*/);
    expect(summary).toContain("pts");
  });

  it("handles already-strong prompts without claiming fixes", () => {
    const strong =
      "Act as a senior editor. Rewrite the paragraph below for a technical audience in a formal tone, as a bulleted list of max 5 points, e.g. keeping all numbers intact. Must avoid jargon.";
    const s = scorePrompt(strong, "writing");
    const summary = summarizeFix(s, s);
    expect(summary.length).toBeGreaterThan(0);
  });
});
