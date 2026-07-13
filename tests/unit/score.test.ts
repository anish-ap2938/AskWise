import { describe, it, expect } from "vitest";
import { scorePrompt } from "../../src/shared/score";

describe("scorePrompt", () => {
  it("returns stable breakdown structure", () => {
    const result = scorePrompt("explain binary search", "quick_improve");
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.breakdown.length).toBeGreaterThan(0);
    expect(Array.isArray(result.missing)).toBe(true);
    expect(["weak", "okay", "strong"]).toContain(result.band);
  });

  it("adding format spec never lowers score", () => {
    const base = scorePrompt("explain binary search", "quick_improve");
    const withFormat = scorePrompt(
      "explain binary search in a step-by-step list format",
      "quick_improve"
    );
    expect(withFormat.total).toBeGreaterThanOrEqual(base.total);
  });

  it("structured prompts score higher than weak prompts", () => {
    const weak = scorePrompt("help", "quick_improve");
    const strong = scorePrompt(
      "Build a job tracker app with auth, CRUD, search/filter, dashboard. Output as a markdown list with acceptance criteria. Must be mobile-responsive for beginners.",
      "app_builder"
    );
    expect(strong.total).toBeGreaterThan(weak.total);
  });
});
