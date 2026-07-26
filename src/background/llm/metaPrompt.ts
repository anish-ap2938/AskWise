import type { ModeId, TargetModel } from "../../shared/types";
import { getRecipe } from "../../shared/recipes";
import { getStyleRules } from "../../shared/styleRules";
import { normalizePromptProse } from "../../shared/extract";

export interface MetaDraft {
  structured: string;
  advanced: string;
}

function getToolRules(target: TargetModel): string {
  switch (target) {
    case "claude":
      return `Mention tools only by purpose when needed. Never invent slash commands or hidden skills.`;
    case "chatgpt":
      return `Mention tools only by purpose when needed. Never invent slash commands or hidden GPTs.`;
    case "gemini":
      return `Mention capabilities only by purpose when needed. Never invent extensions or slash commands.`;
    default:
      return `Never invent tool names or slash commands.`;
  }
}

/**
 * Compact meta-prompt for on-device models.
 * Seeds from Instant drafts so the small model polishes instead of inventing from scratch —
 * much faster and more reliable than open-ended generation.
 */
export function buildMetaPrompt(
  mode: ModeId,
  target: TargetModel,
  redactedPrompt: string,
  draft?: MetaDraft
): { system: string; user: string } {
  const recipe = getRecipe(mode);
  const system = `Rewrite rough user text into a better prompt for another AI. Do NOT answer the task.

Return ONLY JSON: {"structured":"...","advanced":"..."}
Rules:
- Preserve intent and facts; fix spelling/grammar silently (e.g. backery→bakery).
- Keep code, URLs, paths, quotes, identifiers exact.
- structured: short usable prompt (≤110 words).
- advanced: sharper executable prompt (≤200 words) with role, method, output contract, acceptance checks — only if useful.
- Prefer polishing the Instant draft over inventing a new template.
- ${getToolRules(target)}
- Mode focus: ${recipe.label} — ${recipe.description}`;

  const normalizedPrompt = normalizePromptProse(redactedPrompt);
  const draftBlock = draft
    ? `
Instant draft (scaffold — polish, fix spelling, tighten; keep unique structure):
<structured_draft>${truncate(draft.structured, 900)}</structured_draft>
<advanced_draft>${truncate(draft.advanced, 1200)}</advanced_draft>`
    : "";

  const user = `Target: ${target}. ${getStyleRules(target)}

User request:
<raw_prompt>${normalizedPrompt}</raw_prompt>${draftBlock}`;

  return { system, user };
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}
