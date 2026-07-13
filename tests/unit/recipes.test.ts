import { describe, it, expect } from "vitest";
import { recipes } from "../../src/shared/recipes";
import { wordCount } from "../../src/shared/classify";

const SAMPLES = [
  "explain binary search",
  "build me a job tracker app",
  "what is sql join",
  "fix this error in my code",
  "write an email to my manager",
];

describe("recipes", () => {
  for (const recipe of recipes) {
    describe(recipe.id, () => {
      for (const sample of SAMPLES) {
        it(`returns 3 non-empty variants for "${sample.slice(0, 30)}..."`, () => {
          const variants = recipe.localRewrite(sample, { targetModel: "generic" });
          expect(variants.simple.trim().length).toBeGreaterThan(0);
          expect(variants.structured.trim().length).toBeGreaterThan(0);
          expect(variants.advanced.trim().length).toBeGreaterThan(0);
        });
      }
    });
  }

  it("simple_answer advanced variant is capped at ~60 words", () => {
    const recipe = recipes.find((r) => r.id === "simple_answer")!;
    const variants = recipe.localRewrite("what is sql join", { targetModel: "generic" });
    expect(wordCount(variants.advanced)).toBeLessThanOrEqual(60);
  });
});
