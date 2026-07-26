/**
 * Export Instant recipe / sub-recipe pairs as SFT seed data for local fine-tuning.
 *
 *   npm run train:export-seed
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { improveTier1 } from "../src/shared/improve";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outPath = join(root, "training", "data", "seed_sft.jsonl");

const EXTRA_RAW = [
  "i want to build an app for backery",
  "bild me a wep app for fitnes",
  "fix my react login button it does nothing",
  "write a cold email to a hiring manager",
  "compare postgres vs mysql for a saas mvp",
  "help me negotiate salary after an offer",
  "explain the krebs cycle step by step",
  "excel formula to sum values between dates",
  "brainstorm ideas for a newsletter",
  "my page is slow and takes 8 seconds to load",
  "draft a wedding toast for my best friend",
  "build a chrome extension that rewrites prompts",
  "implement dark mode for the settings page",
  "what is kubernetes",
  "research competitors for a habit tracking app",
];

function systemPrompt(modeLabel: string): string {
  return `Rewrite rough user text into a better prompt for another AI. Do NOT answer the task.

Return ONLY JSON: {"structured":"...","advanced":"..."}
Rules:
- Preserve intent and facts; fix spelling/grammar silently.
- Keep code, URLs, paths, quotes, identifiers exact.
- structured: short usable prompt (≤110 words).
- advanced: sharper executable prompt (≤200 words) with role, method, output contract, acceptance checks — only if useful.
- Prefer polishing the Instant draft over inventing a new template.
- Mode focus: ${modeLabel}`;
}

function row(raw: string, result: ReturnType<typeof improveTier1>) {
  const assistant = JSON.stringify({
    structured: result.variants.structured,
    advanced: result.variants.advanced,
  });
  const draft = `Instant draft (scaffold — polish, fix spelling, tighten; keep unique structure):
<structured_draft>${result.variants.structured.slice(0, 900)}</structured_draft>
<advanced_draft>${result.variants.advanced.slice(0, 1200)}</advanced_draft>`;

  return {
    messages: [
      { role: "system", content: systemPrompt(result.mode) },
      {
        role: "user",
        content: `Target: chatgpt.

User request:
<raw_prompt>${raw}</raw_prompt>
${draft}`,
      },
      { role: "assistant", content: assistant },
    ],
    meta: {
      mode: result.mode,
      subRecipe: result.subRecipe?.id ?? null,
      category: result.subRecipe?.category ?? null,
    },
  };
}

const fixtures = JSON.parse(
  readFileSync(join(root, "tests/fixtures/prompts.json"), "utf8")
) as { fixtures: Array<{ text: string }> };

const raws = [
  ...new Set([
    ...fixtures.fixtures.map((f) => f.text).filter(Boolean),
    ...EXTRA_RAW,
  ]),
];

const lines: string[] = [];
for (const raw of raws) {
  try {
    const result = improveTier1(raw, "chatgpt");
    lines.push(JSON.stringify(row(raw, result)));
  } catch (err) {
    console.warn(`skip: ${raw.slice(0, 60)}…`, err);
  }
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, lines.join("\n") + "\n");
console.log(`Wrote ${lines.length} examples → ${outPath}`);
