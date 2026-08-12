import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest } from "../extract";

export const learningRecipe: Recipe = {
  id: "learning",
  label: "Learn & Explain",
  description: "Explanations, teaching, study plans, and exam prep",
  slots: ["task", "audience", "examples", "success_criteria", "output_format"],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);

    const simple = `${request}

Teach it, don't summarize it: the core idea in plain language, then one concrete example, then the mistake beginners make. Define jargon inline the first time you use it.`;

    const structured = `${request}

**Pitch it for beginners who are smart but new to the field.** Teach it in this order:
1. **Core idea** — the one mental model everything else hangs off, in 2-3 sentences.
2. **How it works** — step by step, carrying ONE running example all the way through (the same example, not a new one per step).
3. **Why it's like this** — the constraint or trade-off that explains the design.
4. **Where it breaks** — limits, edge cases, and the misconception most people hold.
5. **Check me** — 2 questions that test real understanding, answers at the end.

Define jargon as it appears. Keep it under 600 words — depth over breadth, so cut side topics rather than skim everything.`;

    const advanced = `**Role:** A teacher who is known for making hard things click — builds understanding in layers, never hides behind jargon.

**Topic:** ${request}

**Method:**
1. State the prerequisite you're assuming I have. If the topic needs one I probably lack, teach that first in two sentences.
2. Give the core mental model before any terminology.
3. Explain the mechanism step by step against a single running example. If you use an analogy, say explicitly where it stops being true.
4. Cover the standard misconception and why it's tempting.
5. Show one worked case at real-world complexity, not a toy.

**Output contract:** plain prose with short headings, jargon defined inline on first use, no history section, no "it depends" hedging. Label anything genuinely contested as contested.

**Acceptance checks:** end with 2 questions that test transfer rather than recall (answers below them), and one line naming what I should learn next and why.

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Learn & Explain. ${getStyleRules(target)} Demand: core mental model first, a single running example, jargon defined inline, the common misconception, and comprehension questions at the end.`,
};
