import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest } from "../extract";

export const researchRecipe: Recipe = {
  id: "research",
  label: "Deep Research",
  description: "Research, compare, and landscape questions",
  slots: ["task", "recency", "citations", "output_format", "success_criteria"],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);

    const simple = `${request}

Use recent sources and cite them. Separate what's well-established from what's speculative. End with the 3 most important takeaways.`;

    const structured = `Research task: ${request}

**Ground rules:**
- Prefer sources from the last 1-2 years; cite them inline so I can verify
- Distinguish clearly: established fact vs. common opinion vs. your inference
- If the evidence is thin or contested somewhere, say so — don't paper over it

**Deliver:**
1. Executive summary (3-5 sentences)
2. Key findings, each with its source
3. A comparison table if there are options/competitors to weigh
4. What's uncertain or missing from available information
5. Your 3 most actionable conclusions, ranked`;

    const advanced = `**Role:** Research analyst who values accuracy over completeness

**Task:** ${request}

**Method:**
1. Frame: state the 2-3 sub-questions this breaks into.
2. Research each with recent, credible sources — cite inline.
3. Label every claim: [established] / [contested] / [my inference].
4. Steelman the opposite view of your main conclusion in 2-3 sentences.

**Output:**
- Executive summary → findings with sources → comparison table (if applicable) → gaps and uncertainties → 3 ranked, actionable recommendations
- Flag anything a decision-maker would regret not knowing

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Deep Research. ${getStyleRules(target)} Emphasize citations, recency, fact-vs-inference labeling, steelman of the opposite view, acceptance criteria for "research is done", and ranked actionable conclusions. Never invent sources.`,
};
