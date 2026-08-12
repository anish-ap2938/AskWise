import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { analyze } from "../../src/shared/intentFeatures";
import { intentScores, isIntentModelReady, setIntentModel } from "../../src/shared/intentModel";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = join(__dirname, "../../public/assets/intent-model.json");
const PROBE_PATH = join(__dirname, "../../training/data/raw/parity_probe.json");

describe("intentFeatures.analyze", () => {
  it("emits word unigrams and bigrams", () => {
    const toks = analyze("fix my app");
    expect(toks).toContain("fix");
    expect(toks).toContain("fix my");
    expect(toks).toContain("my app");
  });

  it("emits padded character n-grams", () => {
    expect(analyze("cat")).toContain("# ca");
    expect(analyze("cat")).toContain("# cat ");
  });

  it("emits structural markers", () => {
    const toks = analyze("why does `foo()` at https://x.dev throw a 500?");
    expect(toks).toContain("§code");
    expect(toks).toContain("§url");
    expect(toks).toContain("§httperr");
    expect(toks).toContain("§q");
    expect(toks).toContain("§first_why");
  });

  it("omits the question marker when text does not end in a question mark", () => {
    expect(analyze("fix this now")).not.toContain("§q");
  });

  it("buckets by word count", () => {
    expect(analyze("a b")).toContain("§wca");
    expect(analyze("a b c d e")).toContain("§wcb");
  });
});

describe("intentModel", () => {
  it("returns null before a model is registered", () => {
    // Only meaningful when nothing has loaded a model into the module yet.
    if (!isIntentModelReady()) {
      expect(intentScores("hello")).toBeNull();
    }
  });

  const haveArtifacts = existsSync(MODEL_PATH) && existsSync(PROBE_PATH);

  it.skipIf(!haveArtifacts)("matches scikit-learn decision scores (TS/Python parity)", () => {
    setIntentModel(JSON.parse(readFileSync(MODEL_PATH, "utf-8")));
    const probe = JSON.parse(readFileSync(PROBE_PATH, "utf-8")) as {
      classes: string[];
      cases: Array<{ text: string; scores: number[] }>;
    };

    for (const c of probe.cases) {
      const got = intentScores(c.text);
      expect(got, `no scores for "${c.text}"`).not.toBeNull();
      probe.classes.forEach((cls, i) => {
        // int8 weight quantization costs a little precision; margins are ~1.0
        expect(got![cls as keyof typeof got] as number).toBeCloseTo(c.scores[i], 1);
      });
      const bestPy = probe.classes[c.scores.indexOf(Math.max(...c.scores))];
      const entries = Object.entries(got!) as Array<[string, number]>;
      const bestTs = entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
      expect(bestTs).toBe(bestPy);
    }
  });
});
