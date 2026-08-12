/**
 * Attach AskWise Instant drafts to a pool of raw prompts, for the SFT teacher pass.
 *
 * Emits the exact system/user strings the extension builds at runtime, so the
 * fine-tuned student sees the same prompt in training as it will in production.
 *
 * Reads  JSONL with {"text", "mode"?}
 * Writes JSONL with {"text","mode","structured","advanced","subRecipe","system","user"}
 *
 *   npx tsx scripts/export-drafts.ts training/data/raw/sft_pool.jsonl training/data/raw/sft_drafts.jsonl
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildMetaPrompt } from "../src/background/llm/metaPrompt";
import { improveTier1 } from "../src/shared/improve";
import { redactSecrets } from "../src/shared/redact";
import type { ModeId } from "../src/shared/types";

const [inPath, outPath] = process.argv.slice(2);
if (!inPath || !outPath) {
  console.error("usage: tsx scripts/export-drafts.ts <in.jsonl> <out.jsonl>");
  process.exit(1);
}

/** Product modes that Instant can override (excludes custom). Keep in sync with ModeId. */
const MODES = new Set<string>([
  "quick_improve",
  "simple_answer",
  "research",
  "app_builder",
  "coding_debug",
  "agent_task",
  "resume_job",
  "writing",
  "data_analysis",
  "learning",
  "planning",
  "marketing",
  "business",
  "finance",
  "health",
  "math_help",
  "translation",
  "image_gen",
]);

const out: string[] = [];
let skipped = 0;

for (const line of readFileSync(inPath, "utf8").split("\n")) {
  if (!line.trim()) continue;
  let row: { text?: string; mode?: string };
  try {
    row = JSON.parse(line);
  } catch {
    skipped++;
    continue;
  }
  const text = (row.text ?? "").trim();
  if (!text) {
    skipped++;
    continue;
  }
  // Trust the labeled mode when we have one; otherwise let AskWise classify.
  const override = row.mode && MODES.has(row.mode) ? (row.mode as ModeId) : undefined;
  try {
    const r = improveTier1(text, "chatgpt", override);
    const { system, user } = buildMetaPrompt(r.mode, "chatgpt", redactSecrets(text).redacted, {
      structured: r.variants.structured,
      advanced: r.variants.advanced,
    });
    out.push(
      JSON.stringify({
        text,
        mode: r.mode,
        structured: r.variants.structured,
        advanced: r.variants.advanced,
        subRecipe: r.subRecipe?.id ?? null,
        system,
        user,
      })
    );
  } catch {
    skipped++;
  }
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out.join("\n") + "\n");
console.log(`Wrote ${out.length} drafts (skipped ${skipped}) → ${outPath}`);
