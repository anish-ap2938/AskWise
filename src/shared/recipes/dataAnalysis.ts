import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest, extractSignals } from "../extract";

export const dataAnalysisRecipe: Recipe = {
  id: "data_analysis",
  label: "Data Analysis",
  description: "SQL, pandas, Excel, charts, and datasets",
  slots: ["context", "task", "output_format", "success_criteria"],
  localRewrite(raw, ctx) {
    const signals = extractSignals(raw);
    const request = cleanRequest(raw.replace(/```[\s\S]*?```/g, "").trim() || raw);
    const dataSection =
      signals.codeBlocks.length > 0
        ? signals.codeBlocks.join("\n\n")
        : "[paste your data sample, schema, or describe the columns here]";

    const simple = `${request}

State your assumptions about the data explicitly, show the code you'd use, and rank findings by business impact — not by how easy they were to compute.

${dataSection}`;

    const structured = `Analysis task: ${request}

**The business question I'm actually trying to answer:** [what decision will this inform?]

**Method:**
1. First, tell me what you understand about the data's shape and flag anything suspicious (nulls, outliers, weird distributions) before analyzing.
2. State every assumption explicitly.
3. Analyze, showing the code (pandas/SQL as appropriate) so I can rerun it.

**Deliver:** key metrics → 3 insights ranked by impact → anomalies worth investigating → the code, commented.

${dataSection}`;

    const advanced = `**Role:** Data analyst who leads with the "so what"

**Task:** ${request}

**Business question:** [what decision does this inform? if I haven't said, ask before analyzing]

**Method:**
1. Data audit first: shape, quality issues, anything that would invalidate the analysis. Flag before proceeding.
2. Assumptions: state every one explicitly.
3. Analysis with runnable, commented code (pandas/SQL).
4. Sanity check: does each finding survive an obvious alternative explanation?

**Deliver:**
- Key metrics with context (vs. what baseline?)
- 3 insights ranked by business impact, each with the evidence
- Anomalies worth a follow-up
- Code I can rerun

${dataSection}

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Data Analysis. ${getStyleRules(target)} Demand: business question, data audit, explicit assumptions, runnable code, insights ranked by impact.`,
};
