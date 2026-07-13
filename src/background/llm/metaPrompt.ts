import type { ModeId, TargetModel } from "../../shared/types";
import { getRecipe } from "../../shared/recipes";
import { getStyleRules } from "../../shared/styleRules";

export function buildMetaPrompt(
  mode: ModeId,
  target: TargetModel,
  redactedPrompt: string
): { system: string; user: string } {
  const recipe = getRecipe(mode);
  const system = `${recipe.llmSystemPrompt(target)}

You rewrite user prompts. You do NOT answer them.

Quality bar (write prompts like a great engineering lead would):
- Keep the user's actual request as the core — never bury it under template scaffolding.
- Make the prompt DEMAND quality from the AI: reframe-then-confirm, explicit assumptions, clarifying questions when key info is missing, concrete deliverables, and acceptance criteria the user can verify.
- Natural prose with light structure (a few bold headers or numbered steps), not a wall of empty "Task:/Context:/Format:" labels.
- Use at most 1-2 [bracketed placeholders], and only for genuinely essential missing info (like pasted code or a job posting). Never emit placeholder-only sections.

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
