import type { ModeId, RewriteContext, VariantSet } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest, extractSignals } from "../extract";
import type { SubRecipeDef } from "./types";
import { careerPack } from "./packs/career";
import { codingPack } from "./packs/coding";
import { learningPack } from "./packs/learning";
import { writingPack } from "./packs/writing";
import { builderPack } from "./packs/builder";
import { researchPack } from "./packs/research";
import { dataPack } from "./packs/data";

export type { SubRecipeDef } from "./types";

export const allSubRecipes: SubRecipeDef[] = [
  ...careerPack,
  ...codingPack,
  ...learningPack,
  ...writingPack,
  ...builderPack,
  ...researchPack,
  ...dataPack,
];

const compiled = allSubRecipes.map((def) => ({
  def,
  regexes: def.triggers.map((t) => new RegExp(t, "i")),
}));

/** First sub-recipe under `mode` with a matching trigger, or null. */
export function findSubRecipe(raw: string, mode: ModeId): SubRecipeDef | null {
  for (const { def, regexes } of compiled) {
    if (def.parent !== mode) continue;
    if (regexes.some((re) => re.test(raw))) return def;
  }
  return null;
}

function interpolate(template: string, raw: string): string {
  const request = cleanRequest(raw.replace(/```[\s\S]*?```/g, "").trim() || raw);
  const signals = extractSignals(raw);
  const code =
    signals.codeBlocks.length > 0
      ? signals.codeBlocks.join("\n\n")
      : "[paste your code / data / current text here]";
  return template.replaceAll("{{request}}", request).replaceAll("{{code}}", code);
}

/** First paragraph of the structured template — used when `simple` is omitted. */
function deriveSimple(structured: string, raw: string): string {
  const firstBlock = structured.split(/\n\s*\n/)[0] ?? structured;
  return `${firstBlock}\n\nKeep it practical and concrete — examples over theory.`.replaceAll(
    "{{request}}",
    cleanRequest(raw)
  );
}

const RIGOR_FOOTER = `**Rigor:**
- State every assumption explicitly; if a key detail is missing, ask up to 2 sharp questions before answering.
- Flag anything where experts disagree or where the answer depends on my situation.
- End with the single most important next step.`;

export function renderSubRecipe(
  def: SubRecipeDef,
  raw: string,
  ctx: RewriteContext
): VariantSet {
  const structured = interpolate(def.structured, raw);
  const simple = def.simple ? interpolate(def.simple, raw) : deriveSimple(def.structured, raw);
  const advanced = def.advanced
    ? interpolate(def.advanced, raw)
    : `${structured}\n\n${RIGOR_FOOTER}\n\n${getStyleRules(ctx.targetModel)}`;

  return { simple, structured, advanced };
}
