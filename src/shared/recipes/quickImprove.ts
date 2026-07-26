import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest } from "../extract";
import { expertHowToAnswerBlock, EXPERT_RIGOR_FOOTER } from "../promptQuality";
import { structureIndex } from "./structurePick";

function structuredVariant(request: string, idx: number): string {
  switch (idx) {
    case 0:
      return `${request}

${expertHowToAnswerBlock()}`;
    case 1:
      return `**Ask:** ${request}

**Answer shape:**
1. Bottom line in 2 sentences.
2. The 3 levers that matter most for this ask.
3. What to ignore / common traps.
4. One concrete next action I can take in <30 minutes.`;
    case 2:
      return `I need expert help with: ${request}

Treat this like a consult:
- Diagnose what I'm actually trying to achieve (push back if my ask is the wrong framing).
- Give the recommended path first, alternatives second.
- Call out trade-offs and the single risk most likely to bite me.
- End with a checklist I can tick to know I'm done.`;
    default:
      return `Goal: ${request}

Respond in this contract:
**Situation** — restate my context in one line (assumptions labeled).
**Task** — what "done" looks like.
**Constraints** — hard limits, safety, or quality bars.
**Output** — exact format I should receive (bullets / steps / table / draft).
Then deliver that output.`;
  }
}

export const quickImproveRecipe: Recipe = {
  id: "quick_improve",
  label: "Quick Improve",
  description: "Generic improvement for short asks",
  slots: ["task", "context", "output_format", "success_criteria"],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);
    const idx = structureIndex(raw, 4);

    const simple = `${request}

Answer like a sharp specialist: lead with the useful answer, use concrete examples, and ask one clarifying question only if it would change what you recommend.`;

    const structured = structuredVariant(request, idx);

    const advanced = `${structured}

**Role:** Act as the best specialist for this exact request (name the specialty in one clause).

${EXPERT_RIGOR_FOOTER}

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Quick Improve. ${getStyleRules(target)} Keep the user's own words as the core. Add a demanding specialist method: reframe, ≤2 clarifying questions or explicit assumptions, concrete deliverables, uncertainty labels, and a verifiable next step.`,
};
