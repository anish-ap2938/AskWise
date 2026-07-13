import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest } from "../extract";

export const quickImproveRecipe: Recipe = {
  id: "quick_improve",
  label: "Quick Improve",
  description: "Generic improvement for short asks",
  slots: ["task", "context", "output_format"],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);

    const simple = `${request}

Be specific and practical — concrete examples over theory. If anything important is ambiguous, ask me one clarifying question first.`;

    const structured = `${request}

**How to answer:**
- Start with a one-sentence summary of your understanding of what I'm asking. If something important is missing, ask up to 2 clarifying questions before answering.
- Structure the answer with clear headings and concrete examples.
- End with the single most important takeaway or next step.
- No filler, no generic advice I could get from a search result.`;

    const advanced = `${request}

**Your approach:**
1. Restate what I'm asking in one sentence — so I can correct you if you misread it.
2. If a key detail is missing (my context, constraints, or goal), ask up to 2 sharp questions. Otherwise state your assumptions in one line and proceed.
3. Answer with clear structure: headings, concrete examples, actionable steps.
4. Flag anything where experts disagree or where the answer depends on my situation.
5. End with: the one thing I should do next.

Keep it tight — depth over length.

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Quick Improve. ${getStyleRules(target)} Keep the user's own words as the core; add at most a short "how to answer" scaffold. Never bury the request in template noise.`,
};
