import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest } from "../extract";

export const marketingRecipe: Recipe = {
  id: "marketing",
  label: "Marketing & Growth",
  description: "Ad copy, landing pages, SEO, social, and campaigns",
  slots: ["audience", "task", "constraints", "output_format", "success_criteria"],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);

    const simple = `${request}

Write it for a specific buyer, not "everyone": lead with the outcome they want, use their words instead of ours, and end with one clear action. Give me 3 different angles, not 3 rewordings.`;

    const structured = `${request}

**First, state who this is for** — the specific person, what they're already trying to do, and what makes them hesitate. Say it in two lines before writing anything.

**Then write copy that:**
- Leads with the outcome or the pain, never with our company name
- Uses the customer's vocabulary, not internal or category jargon
- Backs every claim with something concrete (a number, a proof point, a specific)
- Ends with one action, not three

**Deliver:** 3 genuinely different angles (not reworded twins) — label the insight behind each → the one you'd ship and why → the metric that tells us it worked.`;

    const advanced = `**Role:** A direct-response marketer who has watched a lot of clever copy fail and optimizes for the click, not the compliment.

**Brief:** ${request}

**Method:**
1. Define the target in one line: who they are, the job they're hiring this for, and the objection blocking them.
2. Name the funnel stage (cold / considering / ready) — it decides the length and how hard the ask can be.
3. Write 3 distinct angles built on different insights: e.g. outcome, objection-killer, status-quo cost. Label the insight above each.
4. Kill anything that could appear in a competitor's copy unchanged. If it's swappable, it's not positioning.

**Output contract:** channel-appropriate format and length, headline plus body plus a single CTA per angle, no superlatives without evidence, no invented statistics or testimonials.

**Acceptance checks:** recommend one angle to ship first with the reason; state the metric and the rough threshold that would count as working; name the fastest cheap test to find out.

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Marketing & Growth. ${getStyleRules(target)} Demand: a specific target customer and objection, funnel stage, 3 distinct angles with the insight labeled, one CTA, no invented stats, and a success metric.`,
};
