import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { classify } from "../../src/shared/classify";
import type { ModeId } from "../../src/shared/types";

interface Fixture {
  id: string;
  text: string;
  expected: ModeId;
  stretch?: boolean;
}

const data = JSON.parse(
  readFileSync(join(__dirname, "../fixtures/prompts.json"), "utf-8")
) as { fixtures: Fixture[] };

describe("classify", () => {
  it("meets 85% accuracy on non-stretch fixtures", () => {
    const gated = data.fixtures.filter((f) => !f.stretch);
    let correct = 0;
    const failures: string[] = [];

    for (const f of gated) {
      const result = classify(f.text);
      if (result === f.expected) {
        correct++;
      } else {
        failures.push(`${f.id}: expected ${f.expected}, got ${result}`);
      }
    }

    const accuracy = correct / gated.length;
    if (failures.length > 0) {
      console.log("Failures:", failures.join("\n"));
    }
    expect(accuracy).toBeGreaterThanOrEqual(0.85);
  });

  it("never throws on garbage input", () => {
    expect(() => classify("asdfgh qwerty")).not.toThrow();
    expect(classify("asdfgh qwerty")).toBe("quick_improve");
  });
});
