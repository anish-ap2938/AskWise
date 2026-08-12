/**
 * Grid-search the hybrid classifier constants against the hand-labeled fixtures.
 *
 * The rules and the model each have blind spots: rules are precise but literal,
 * the model generalizes but drifts on product-specific intent. This finds the
 * blend that maximizes stretch accuracy without giving up gated accuracy.
 *
 * Usage: npx tsx scripts/tune-hybrid.ts
 * Copy the winning constants into src/shared/classify.ts.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyScores } from "../src/shared/classify";
import { intentProbabilities, setIntentModel } from "../src/shared/intentModel";
import type { ModeId } from "../src/shared/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = join(__dirname, "../public/assets/intent-model.json");

if (!existsSync(MODEL_PATH)) {
  console.error("No intent model built yet — run npm run train:intent first.");
  process.exit(1);
}
setIntentModel(JSON.parse(readFileSync(MODEL_PATH, "utf-8")));

interface Fixture {
  id: string;
  text: string;
  expected: ModeId;
  stretch?: boolean;
}
const { fixtures } = JSON.parse(
  readFileSync(join(__dirname, "../tests/fixtures/prompts.json"), "utf-8")
) as { fixtures: Fixture[] };

// Precompute both signals once; the sweep is then pure arithmetic.
const rows = fixtures.map((f) => ({
  ...f,
  rules: classifyScores(f.text.trim()),
  probs: intentProbabilities(f.text.trim()),
}));

function topOf(scores: Partial<Record<ModeId, number>>): [ModeId, number] {
  return Object.entries(scores).reduce<[ModeId, number]>(
    (a, b) => (b[1]! > a[1] ? [b[0] as ModeId, b[1]!] : a),
    ["quick_improve", 0]
  );
}

function decide(
  row: (typeof rows)[number],
  ruleTrust: number,
  mlWeight: number,
  decideMin: number,
  modelMinP: number
): ModeId {
  const top = topOf(row.rules);
  if (top[1] >= ruleTrust) return top[0];
  if (!row.probs) return top[1] >= decideMin ? top[0] : "quick_improve";

  const blended: Partial<Record<ModeId, number>> = { ...row.rules };
  for (const [mode, p] of Object.entries(row.probs) as Array<[ModeId, number]>) {
    blended[mode] = (blended[mode] ?? 0) + mlWeight * p;
  }
  const best = topOf(blended);
  if (best[1] >= decideMin) return best[0];

  const mlTop = topOf(row.probs);
  return mlTop[1] >= modelMinP ? mlTop[0] : "quick_improve";
}

const gated = rows.filter((r) => !r.stretch);
const stretch = rows.filter((r) => r.stretch);

interface Result {
  ruleTrust: number;
  mlWeight: number;
  decideMin: number;
  modelMinP: number;
  gated: number;
  stretch: number;
}
const results: Result[] = [];

for (const ruleTrust of [5, 6, 7, 8, 9, 99]) {
  for (const mlWeight of [0, 2, 3, 4, 5, 6, 8, 10, 14, 20]) {
    for (const decideMin of [2, 3, 4, 5]) {
      for (const modelMinP of [0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 1.1]) {
        const g = gated.filter(
          (r) => decide(r, ruleTrust, mlWeight, decideMin, modelMinP) === r.expected
        ).length;
        const s = stretch.filter(
          (r) => decide(r, ruleTrust, mlWeight, decideMin, modelMinP) === r.expected
        ).length;
        results.push({ ruleTrust, mlWeight, decideMin, modelMinP, gated: g, stretch: s });
      }
    }
  }
}

const pct = (n: number, d: number) => `${((n / d) * 100).toFixed(1)}%`;

// The gated fixtures are the set the keyword rules were originally tuned against,
// so scoring on volume alone just re-selects rules-only. Treat gated accuracy as a
// constraint to protect and stretch accuracy — genuine paraphrases — as the goal.
const GATED_FLOOR = 0.97;
const viable = results.filter((r) => r.gated / gated.length >= GATED_FLOOR);
viable.sort((a, b) => b.stretch - a.stretch || b.gated - a.gated || a.mlWeight - b.mlWeight);
console.log(`constraint: gated >= ${pct(GATED_FLOOR, 1)} — maximizing stretch\n`);

console.log(`fixtures: ${gated.length} gated, ${stretch.length} stretch\n`);
console.log("top 15 configurations:");
console.log(
  `  ${"ruleTrust".padStart(9)} ${"mlWeight".padStart(8)} ${"decideMin".padStart(9)} ${"modelMinP".padStart(9)}  ${"gated".padStart(12)}  ${"stretch".padStart(12)}`
);
for (const r of viable.slice(0, 15)) {
  console.log(
    `  ${String(r.ruleTrust).padStart(9)} ${String(r.mlWeight).padStart(8)} ${String(r.decideMin).padStart(9)} ${String(r.modelMinP).padStart(9)}  ` +
      `${`${r.gated}/${gated.length} ${pct(r.gated, gated.length)}`.padStart(12)}  ` +
      `${`${r.stretch}/${stretch.length} ${pct(r.stretch, stretch.length)}`.padStart(12)}`
  );
}

const rulesOnly = results.find(
  (r) => r.mlWeight === 0 && r.ruleTrust === 7 && r.decideMin === 4 && r.modelMinP === 1.1
)!;
console.log(
  `\nrules-only baseline: gated ${pct(rulesOnly.gated, gated.length)}, stretch ${pct(rulesOnly.stretch, stretch.length)}`
);
const best = viable[0];
console.log(
  `best: RULE_TRUST=${best.ruleTrust} ML_WEIGHT=${best.mlWeight} DECIDE_MIN=${best.decideMin} ` +
    `MODEL_MIN_P=${best.modelMinP} → gated ${pct(best.gated, gated.length)}, stretch ${pct(best.stretch, stretch.length)}`
);
