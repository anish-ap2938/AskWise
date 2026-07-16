import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest } from "../extract";
import { expertHowToAnswerBlock, EXPERT_RIGOR_FOOTER } from "../promptQuality";

export const quickImproveRecipe: Recipe = {
  id: "quick_improve",
  label: "Quick Improve",
  description: "Generic improvement for short asks",
  slots: ["task", "context", "output_format", "success_criteria"],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);

    const simple = `${request}

Answer like a sharp specialist: lead with the useful answer, use concrete examples, and ask one clarifying question only if it would change what you recommend.`;

    const structured = `${request}

${expertHowToAnswerBlock()}`;

    const advanced = `${request}

**Role:** Act as the best specialist for this exact request (name the specialty in one clause — e.g. "as a staff product engineer" / "as a careful science educator").

${expertHowToAnswerBlock()}

${EXPERT_RIGOR_FOOTER}

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Quick Improve. ${getStyleRules(target)} Keep the user's own words as the core. Add a demanding specialist method: reframe, ≤2 clarifying questions or explicit assumptions, concrete deliverables, uncertainty labels, and a verifiable next step. For health/law/finance/science topics, require appropriate safety disclaimers and "do not invent" rules. Never bury the request in template noise.`,
};
