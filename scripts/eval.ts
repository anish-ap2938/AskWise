/**
 * AskWise eval harness — the quality-guarantee machinery.
 *
 * Runs every fixture through classify → rewrite → score and prints a report:
 *   - classification accuracy (gated vs stretch), per-mode breakdown, confusions
 *   - rewrite metrics: score lift, placeholder counts, length stats
 *
 * Usage:
 *   npm run eval                 # fast, deterministic report
 *
 * Exits non-zero if gated classification accuracy drops below 85%.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { classify } from "../src/shared/classify";
import { improveTier1 } from "../src/shared/improve";
import type { ModeId } from "../src/shared/types";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Fixture {
  id: string;
  text: string;
  expected: ModeId;
  stretch?: boolean;
  note?: string;
}

const GATE = 0.85;

const { fixtures } = JSON.parse(
  readFileSync(join(__dirname, "../tests/fixtures/prompts.json"), "utf-8")
) as { fixtures: Fixture[] };

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

// ---------- 1. Classification ----------

interface ModeStats {
  total: number;
  correct: number;
}

const gated = fixtures.filter((f) => !f.stretch);
const stretch = fixtures.filter((f) => f.stretch);
const perMode = new Map<string, ModeStats>();
const confusions: string[] = [];

let gatedCorrect = 0;
for (const f of gated) {
  const got = classify(f.text);
  const stats = perMode.get(f.expected) ?? { total: 0, correct: 0 };
  stats.total++;
  if (got === f.expected) {
    stats.correct++;
    gatedCorrect++;
  } else {
    confusions.push(
      `  ${f.id}: "${f.text.slice(0, 60)}${f.text.length > 60 ? "…" : ""}" → expected ${f.expected}, got ${got}`
    );
  }
  perMode.set(f.expected, stats);
}

let stretchCorrect = 0;
for (const f of stretch) {
  if (classify(f.text) === f.expected) stretchCorrect++;
}

const gatedAccuracy = gated.length > 0 ? gatedCorrect / gated.length : 1;

console.log("\n=== CLASSIFICATION ===");
console.log(
  `Gated:   ${gatedCorrect}/${gated.length}  (${pct(gatedAccuracy)})  [gate: ${pct(GATE)}]`
);
if (stretch.length > 0) {
  console.log(
    `Stretch: ${stretchCorrect}/${stretch.length}  (${pct(stretchCorrect / stretch.length)})  [tracked, not gating]`
  );
}
console.log("\nPer mode (gated):");
for (const [mode, s] of [...perMode.entries()].sort()) {
  const bar = "█".repeat(Math.round((s.correct / s.total) * 20)).padEnd(20, "░");
  console.log(`  ${mode.padEnd(14)} ${bar} ${s.correct}/${s.total}`);
}
if (confusions.length > 0) {
  console.log(`\nMisclassifications (${confusions.length}):`);
  console.log(confusions.join("\n"));
}

// ---------- 2. Rewrite metrics ----------

interface RewriteAgg {
  n: number;
  beforeSum: number;
  afterSum: number;
  liftSum: number;
  placeholders: number;
  regressions: string[];
}

const rewriteAgg = new Map<string, RewriteAgg>();
const PLACEHOLDER_RE = /\[[^\]\n]{3,80}\]/g;

for (const f of fixtures) {
  const r = improveTier1(f.text, "chatgpt");
  const agg =
    rewriteAgg.get(r.mode) ??
    ({ n: 0, beforeSum: 0, afterSum: 0, liftSum: 0, placeholders: 0, regressions: [] } as RewriteAgg);
  agg.n++;
  agg.beforeSum += r.scoreBefore.total;
  agg.afterSum += r.scoreAfter.total;
  agg.liftSum += r.scoreAfter.total - r.scoreBefore.total;
  agg.placeholders += (r.variants.structured.match(PLACEHOLDER_RE) ?? []).length;
  if (r.scoreAfter.total <= r.scoreBefore.total) {
    agg.regressions.push(f.id);
  }
  rewriteAgg.set(r.mode, agg);
}

console.log("\n=== REWRITE (Tier 1, structured variant) ===");
console.log(
  `  ${"mode".padEnd(14)} ${"n".padStart(4)}  ${"before".padStart(6)}  ${"after".padStart(6)}  ${"lift".padStart(6)}  ${"ph/prompt".padStart(9)}`
);
let totalRegressions: string[] = [];
for (const [mode, a] of [...rewriteAgg.entries()].sort()) {
  console.log(
    `  ${mode.padEnd(14)} ${String(a.n).padStart(4)}  ${(a.beforeSum / a.n).toFixed(0).padStart(6)}  ${(a.afterSum / a.n).toFixed(0).padStart(6)}  ${("+" + (a.liftSum / a.n).toFixed(0)).padStart(6)}  ${(a.placeholders / a.n).toFixed(1).padStart(9)}`
  );
  totalRegressions = totalRegressions.concat(a.regressions);
}
if (totalRegressions.length > 0) {
  console.log(`\n  ⚠ Score regressions (after <= before): ${totalRegressions.join(", ")}`);
} else {
  console.log("\n  ✓ No score regressions — every rewrite scores higher than its original.");
}

// ---------- main ----------

const main = () => {
  console.log("\n=== VERDICT ===");
  if (gatedAccuracy >= GATE) {
    console.log(`  ✓ PASS — gated accuracy ${pct(gatedAccuracy)} >= ${pct(GATE)}\n`);
  } else {
    console.log(`  ✗ FAIL — gated accuracy ${pct(gatedAccuracy)} < ${pct(GATE)}\n`);
    process.exit(1);
  }
};

main();
