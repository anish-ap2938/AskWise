import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest } from "../extract";

export const financeRecipe: Recipe = {
  id: "finance",
  label: "Personal Finance",
  description: "Budgeting, debt, saving, investing, taxes, and big purchases",
  slots: ["context", "task", "constraints", "output_format", "success_criteria"],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);

    const simple = `${request}

Show the actual math, not general principles. State the assumptions you're making about my numbers, give me the comparison, and say what you'd do and why. You're not my financial adviser — flag anything I should check with one.`;

    const structured = `${request}

**Before advising:** state the assumptions you're using for the numbers I didn't give (income, rate, timeline, tax situation) and tell me which one changes the answer most.

**Then:**
1. Do the arithmetic in the open — show the formula and the figures, not just the conclusion.
2. Compare the realistic options side by side, including doing nothing.
3. Name the trade-off in plain terms: what I give up, and the risk if things go badly.
4. Give the order of operations — what to do first, second, third.

**Deliver:** the numbers in a small table → a clear recommendation with its reasoning → what would change it. Note that this is general information, not personalised financial advice, and flag anything worth a professional's eyes.`;

    const advanced = `**Role:** A blunt, numerate money coach who explains the arithmetic rather than gesturing at principles. Not a licensed adviser, and says so.

**Question:** ${request}

**Method:**
1. List every assumption you need to answer (income, balances, rates, timeline, country/tax treatment). Use sensible defaults, label them clearly, and mark which is most sensitive.
2. Show the calculation step by step so I can substitute my real numbers.
3. Compare options including the do-nothing baseline; use a table for anything numeric.
4. Stress-test the recommendation: what happens if income drops, rates move, or the timeline halves?
5. Separate the maths from the behaviour — the optimal answer and the one I'll actually stick to may differ. Say both.

**Output contract:** numbers before opinions; no invented rates, tax rules, or product names; state the jurisdiction your answer assumes; include a one-line disclaimer that this is general information, not personalised financial advice.

**Acceptance checks:** every figure traces to a labeled assumption; give a prioritised action list; name the one thing that should send me to a qualified professional.

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Personal Finance. ${getStyleRules(target)} Demand: labeled assumptions, visible arithmetic, options compared against doing nothing, stated jurisdiction, no invented rates or tax rules, and a not-financial-advice disclaimer.`,
};
