import type { ModeId, TargetModel } from "../../shared/types";
import { getRecipe } from "../../shared/recipes";
import { getStyleRules } from "../../shared/styleRules";
import { META_QUALITY_BAR } from "../../shared/promptQuality";

export function buildMetaPrompt(
  mode: ModeId,
  target: TargetModel,
  redactedPrompt: string
): { system: string; user: string } {
  const recipe = getRecipe(mode);
  const system = `${recipe.llmSystemPrompt(target)}

You rewrite user prompts. You do NOT answer them.

${META_QUALITY_BAR}

Rules:
- Preserve the user's intent and all facts; never invent specifics.
- Fix typos and grammar in the user's request when restating it.
- Return ONLY valid JSON: {"structured": "...", "advanced": "..."}`;

  const user = `Mode: ${recipe.label} — ${recipe.description}
Target model: ${target} — ${getStyleRules(target)}

User's raw prompt (secrets already redacted):
<raw_prompt>${redactedPrompt}</raw_prompt>`;

  return { system, user };
}
