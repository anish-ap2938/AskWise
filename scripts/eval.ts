/**
 * AskWise eval harness — the quality-guarantee machinery.
 *
 * Runs every fixture through classify → rewrite → score and prints a report:
 *   - classification accuracy (gated vs stretch), per-mode breakdown, confusions
 *   - rewrite metrics: score lift, placeholder counts, length stats
 *   - optional: local LLM judge (Ollama) rates rewrite quality 1-10
 *
 * Usage:
 *   npm run eval                 # fast, deterministic report
 *   npm run eval -- --judge      # + LLM judge on a sample (needs Ollama running)
 *   npm run eval -- --judge --sample 3   # judge 3 prompts per mode
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
const OLLAMA_URL = "http://localhost:11434";

const args = process.argv.slice(2);
const useJudge = args.includes("--judge");
const sampleIdx = args.indexOf("--sample");
const judgeSample = sampleIdx >= 0 ? Number(args[sampleIdx + 1]) || 2 : 2;

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

// ---------- 3. Optional LLM judge ----------

async function judgeOne(
  model: string,
  raw: string,
  rewritten: string
): Promise<{ score: number; critique: string } | null> {
  const body = {
    model,
    stream: false,
    think: false,
    format: "json",
    messages: [
      {
        role: "system",
        content:
          'You are a strict prompt-engineering judge. Rate the REWRITTEN prompt vs the ORIGINAL on: faithfulness to intent, specificity, actionability, and absence of template noise. Reply ONLY with JSON: {"score": <1-10 integer>, "critique": "<one sentence>"}',
      },
      {
        role: "user",
        content: `ORIGINAL:\n${raw}\n\nREWRITTEN:\n${rewritten}`,
      },
    ],
  };
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { message?: { content?: string } };
    const parsed = JSON.parse(data.message?.content ?? "{}") as {
      score?: number;
      critique?: string;
    };
    if (typeof parsed.score !== "number") return null;
    return { score: parsed.score, critique: parsed.critique ?? "" };
  } catch {
    return null;
  }
}

async function runJudge() {
  console.log("\n=== LLM JUDGE (Ollama) ===");
  let model = "qwen3:8b";
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    const tags = (await res.json()) as { models?: Array<{ name: string }> };
    const names = (tags.models ?? []).map((m) => m.name);
    if (names.length === 0) throw new Error("no models");
    if (!names.includes(model)) model = names[0]!;
    console.log(`  Judge model: ${model}`);
  } catch {
    console.log("  ✗ Ollama not reachable at " + OLLAMA_URL + " — skipping judge.");
    return;
  }

  // Sample N fixtures per expected mode.
  const byMode = new Map<string, Fixture[]>();
  for (const f of fixtures) {
    const list = byMode.get(f.expected) ?? [];
    list.push(f);
    byMode.set(f.expected, list);
  }

  const judged: Array<{ mode: string; id: string; score: number; critique: string }> = [];
  for (const [mode, list] of [...byMode.entries()].sort()) {
    for (const f of list.slice(0, judgeSample)) {
      const r = improveTier1(f.text, "chatgpt");
      const verdict = await judgeOne(model, f.text, r.variants.structured);
      if (verdict) judged.push({ mode, id: f.id, ...verdict });
      process.stdout.write(".");
    }
  }
  console.log("\n");

  if (judged.length === 0) {
    console.log("  ✗ Judge produced no valid verdicts.");
    return;
  }

  const byModeScores = new Map<string, number[]>();
  for (const j of judged) {
    const list = byModeScores.get(j.mode) ?? [];
    list.push(j.score);
    byModeScores.set(j.mode, list);
  }
  console.log(`  ${"mode".padEnd(14)} ${"n".padStart(3)}  mean`);
  for (const [mode, scores] of [...byModeScores.entries()].sort()) {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    console.log(`  ${mode.padEnd(14)} ${String(scores.length).padStart(3)}  ${mean.toFixed(1)}/10`);
  }
  const overall = judged.reduce((a, j) => a + j.score, 0) / judged.length;
  console.log(`\n  Overall: ${overall.toFixed(1)}/10 across ${judged.length} judged rewrites`);

  const worst = [...judged].sort((a, b) => a.score - b.score).slice(0, 5);
  console.log("\n  Lowest-rated (fix these first):");
  for (const w of worst) {
    console.log(`    [${w.score}/10] ${w.id} (${w.mode}): ${w.critique}`);
  }
}

// ---------- main ----------

const main = async () => {
  if (useJudge) await runJudge();

  console.log("\n=== VERDICT ===");
  if (gatedAccuracy >= GATE) {
    console.log(`  ✓ PASS — gated accuracy ${pct(gatedAccuracy)} >= ${pct(GATE)}\n`);
  } else {
    console.log(`  ✗ FAIL — gated accuracy ${pct(gatedAccuracy)} < ${pct(GATE)}\n`);
    process.exit(1);
  }
};

void main();
