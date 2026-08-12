import type { ModeId, RewriteContext, VariantSet } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest, extractSignals } from "../extract";
import type { SubRecipeDef } from "./types";
import { EXPERT_RIGOR_FOOTER } from "../promptQuality";
import { careerPack } from "./packs/career";
import { codingPack } from "./packs/coding";
import { learningPack } from "./packs/learning";
import { writingPack } from "./packs/writing";
import { builderPack } from "./packs/builder";
import { researchPack } from "./packs/research";
import { dataPack } from "./packs/data";
import { healthPack } from "./packs/health";
import { legalPack } from "./packs/legal";
import { financePack } from "./packs/finance";
import { sciencePack } from "./packs/science";
import { agentPack } from "./packs/agent";
import { planningPack } from "./packs/planning";
import { marketingPack } from "./packs/marketing";
import { businessPack } from "./packs/business";
import { mathHelpPack } from "./packs/mathHelp";
import { translationPack } from "./packs/translation";
import { imageGenPack } from "./packs/imageGen";
import { academicPack } from "./packs/academic";
import { everydayPack } from "./packs/everyday";
import { peoplePack } from "./packs/people";
import { languagePack } from "./packs/language";
import { hobbyPack } from "./packs/hobby";
import { productPack } from "./packs/product";
import { devopsPack } from "./packs/devops";
import { mlAiPack } from "./packs/mlai";
import { granularPack } from "./packs/granular";

export type { SubRecipeDef } from "./types";

/** Order matters only as a soft tie-break; matching is scored. */
export const allSubRecipes: SubRecipeDef[] = [
  ...careerPack,
  ...codingPack,
  ...healthPack,
  ...legalPack,
  ...financePack,
  ...sciencePack,
  ...learningPack,
  ...writingPack,
  ...builderPack,
  ...researchPack,
  ...dataPack,
  ...agentPack,
  ...planningPack,
  ...marketingPack,
  ...businessPack,
  ...mathHelpPack,
  ...translationPack,
  ...imageGenPack,
  ...academicPack,
  ...everydayPack,
  ...peoplePack,
  ...languagePack,
  ...hobbyPack,
  ...productPack,
  ...devopsPack,
  ...mlAiPack,
  ...granularPack,
];

const compiled = allSubRecipes.map((def, index) => ({
  def,
  index,
  category: def.category ?? def.id.split("/")[1]?.replace(/_.*/, "") ?? "general",
  regexes: def.triggers.map((t) => new RegExp(t, "i")),
}));

export function subRecipeCategory(def: SubRecipeDef): string {
  return def.category ?? def.id.split("/")[1]?.replace(/_.*/, "") ?? "general";
}

function scoreDef(
  raw: string,
  entry: (typeof compiled)[number]
): number {
  let hits = 0;
  let specificity = 0;
  for (const re of entry.regexes) {
    if (re.test(raw)) {
      hits += 1;
      specificity += re.source.length;
    }
  }
  if (hits === 0) return 0;
  return hits * 10 + specificity * 0.05 + (entry.def.priority ?? 0) - entry.index * 0.001;
}

/** Best sub-recipe under `mode`, or null. */
export function findSubRecipe(raw: string, mode: ModeId): SubRecipeDef | null {
  let best: (typeof compiled)[number] | null = null;
  let bestScore = 0;
  for (const entry of compiled) {
    if (entry.def.parent !== mode) continue;
    const score = scoreDef(raw, entry);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best!.def : null;
}

/**
 * Strong global match used when the parent mode has no sub-recipe hit.
 * Requires a clear keyword win so we don't steal soft matches.
 */
export function findBestSubRecipe(
  raw: string,
  minScore = 12
): SubRecipeDef | null {
  let best: (typeof compiled)[number] | null = null;
  let bestScore = 0;
  for (const entry of compiled) {
    const score = scoreDef(raw, entry);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return bestScore >= minScore ? best!.def : null;
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

export function renderSubRecipe(
  def: SubRecipeDef,
  raw: string,
  ctx: RewriteContext
): VariantSet {
  const structured = interpolate(def.structured, raw);
  const simple = def.simple ? interpolate(def.simple, raw) : deriveSimple(def.structured, raw);
  const advanced = def.advanced
    ? interpolate(def.advanced, raw)
    : `${structured}\n\n${EXPERT_RIGOR_FOOTER}\n\n${getStyleRules(ctx.targetModel)}`;

  return { simple, structured, advanced };
}
