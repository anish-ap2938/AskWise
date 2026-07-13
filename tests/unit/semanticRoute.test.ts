import { describe, expect, it } from "vitest";
import {
  REFERENCE_PHRASES,
  cosineSimilarity,
  pickMode,
} from "../../src/shared/semanticRoute";

describe("pickMode", () => {
  it("routes when top score clears threshold and margin", () => {
    const verdict = pickMode([
      { mode: "resume_job", score: 0.62 },
      { mode: "writing", score: 0.4 },
    ]);
    expect(verdict?.mode).toBe("resume_job");
    expect(verdict?.confidence).toBeCloseTo(0.62);
  });

  it("returns null below the threshold", () => {
    expect(
      pickMode([
        { mode: "writing", score: 0.3 },
        { mode: "research", score: 0.2 },
      ])
    ).toBeNull();
  });

  it("returns null when the top two are too close (ambiguous)", () => {
    expect(
      pickMode([
        { mode: "writing", score: 0.61 },
        { mode: "resume_job", score: 0.59 },
      ])
    ).toBeNull();
  });

  it("handles a single candidate", () => {
    expect(pickMode([{ mode: "coding_debug", score: 0.7 }])?.mode).toBe("coding_debug");
  });

  it("handles empty input", () => {
    expect(pickMode([])).toBeNull();
  });
});

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors and 0 for orthogonal ones", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("handles zero vectors without NaN", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe("REFERENCE_PHRASES", () => {
  it("covers every specific mode with at least 5 phrases", () => {
    for (const [mode, phrases] of Object.entries(REFERENCE_PHRASES)) {
      expect(phrases!.length, `${mode} needs >=5 phrases`).toBeGreaterThanOrEqual(5);
    }
    expect(Object.keys(REFERENCE_PHRASES)).not.toContain("quick_improve");
  });
});
