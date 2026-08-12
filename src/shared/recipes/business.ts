import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest } from "../extract";

export const businessRecipe: Recipe = {
  id: "business",
  label: "Business & Strategy",
  description: "Business plans, pricing, GTM, specs, and positioning",
  slots: ["context", "task", "constraints", "success_criteria", "output_format"],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);

    const simple = `${request}

Give me the version with numbers in it: who pays, how much, what it costs to serve them, and the assumption that would sink this if it's wrong. Skip the generic startup advice.`;

    const structured = `${request}

**Open with the sharpest question first:** who exactly is the customer, and what do they do today instead? If my framing is wrong, say so before answering.

**Then work through:**
1. The problem and who has it badly enough to pay
2. The offer and the pricing, with the arithmetic shown (unit economics, not vibes)
3. The 2-3 assumptions this whole thing rests on — ranked by how much damage a wrong one does
4. What would have to be true for this to fail, honestly

**Deliver:** a recommendation → the numbers behind it → the riskiest assumption and the cheapest test for it → the next 30 days of milestones.`;

    const advanced = `**Role:** An operator-turned-advisor who has seen this business model succeed and fail, and would rather kill a bad idea early than be encouraging.

**Situation:** ${request}

**Method:**
1. Restate the business in one sentence: customer, problem, how money is made. Correct my framing if it's off.
2. Size it roughly with stated assumptions and visible arithmetic — label every number as known, estimated, or guessed.
3. Work the unit economics: price, cost to serve, acquisition cost, payback. Say plainly if they don't work.
4. Rank the top 3 risks by damage × likelihood, and give the cheapest experiment that would resolve each.
5. Steelman the strongest reason not to do this.

**Output contract:** a clear recommendation up front, then the reasoning; tables for anything numeric; no invented market statistics — if you don't know a figure, mark it as an assumption to verify.

**Acceptance checks:** every number traces to a stated assumption; the riskiest assumption has a test costing under two weeks; close with 30-day milestones and the metric that says keep going or stop.

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Business & Strategy. ${getStyleRules(target)} Demand: customer and problem restated, visible unit economics with labeled assumptions, ranked risks with cheap tests, no invented market data, and 30-day milestones.`,
};
