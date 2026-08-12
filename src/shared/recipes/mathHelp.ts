import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest, extractSignals } from "../extract";

export const mathHelpRecipe: Recipe = {
  id: "math_help",
  label: "Math & Problem Solving",
  description: "Worked solutions for math, stats, and physics problems",
  slots: ["task", "context", "output_format", "success_criteria", "self_check"],
  localRewrite(raw, ctx) {
    const signals = extractSignals(raw);
    const request = cleanRequest(raw.replace(/```[\s\S]*?```/g, "").trim() || raw);
    const workSection =
      signals.codeBlocks.length > 0 ? `\n\n${signals.codeBlocks.join("\n\n")}` : "";

    const simple = `${request}

Work it out step by step and show every line — I need to follow the method, not just get the answer. Say which technique you're using and why, then check the result at the end.${workSection}`;

    const structured = `${request}

**Solve it so I can learn the method, not just copy the answer:**
1. Restate the problem and list what's given and what's being asked, with units.
2. Name the technique you're using and why it fits this problem — that choice is the part I keep getting wrong.
3. Work through every step. No skipped algebra, no "it can be shown that".
4. State the final answer clearly, with units and correct significant figures.
5. Verify it — substitute back, sanity-check the magnitude, or solve a second way.
6. Name the mistake most people make on this type of problem.

Use plain notation I can read in a chat window.${workSection}`;

    const advanced = `**Role:** A patient tutor who is graded on whether I can solve the next one alone, not on producing the answer.

**Problem:** ${request}

**Method:**
1. Parse the problem: givens, unknowns, units, and any implicit constraint or assumption.
2. Before solving, state the solution strategy in one sentence and why the obvious alternative is worse here.
3. Derive step by step. Every line must follow from the previous one by a stated operation.
4. Box the final answer with units and appropriate precision.
5. Verify independently — back-substitution, dimensional analysis, an estimate, or a second method. If verification fails, say so and find the error rather than papering over it.
6. Generalise: what class of problem is this, and what's the trigger that tells me to use this technique again?

**Output contract:** readable plain-text or LaTeX-light notation, one step per line, no skipped algebra, no fabricated formulas. If the problem is ambiguous or underdetermined, say exactly what's missing instead of assuming your way to an answer.

**Acceptance checks:** the verification step is shown and passes; units are consistent throughout; end with one similar practice problem and its answer.${workSection}

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Math & Problem Solving. ${getStyleRules(target)} Demand: givens and unknowns listed, the technique named and justified, every algebraic step shown, units and significant figures, an independent verification, and the common mistake.`,
};
