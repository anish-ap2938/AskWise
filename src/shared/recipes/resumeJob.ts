import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest } from "../extract";

export const resumeJobRecipe: Recipe = {
  id: "resume_job",
  label: "Resume / Job",
  description: "Resume bullets, cover letters, and interview prep",
  slots: ["task", "audience", "constraints", "output_format"],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);

    const simple = `${request}

Make it ATS-friendly and quantified, but stay truthful to my actual experience — sharpen, don't inflate. Give me 3 versions to choose from.

[paste your current text and the target role below]`;

    const structured = `${request}

**Context you need from me:** [paste your current bullet/letter AND the job posting or target role]

**Rules:**
- Truthful to my real experience — sharpen the impact, never invent numbers or scope
- Lead with impact and outcome, not responsibilities
- ATS-friendly wording (mirror key terms from the posting naturally)
- If my original is missing a quantifiable result, ask me for it instead of making one up

**Give me 3 versions:** punchy/concise, business-impact framing, technical-depth framing. One line on when to use each.`;

    const advanced = `**Role:** Career coach who has read thousands of resumes on both sides of hiring

**Task:** ${request}

**Inputs:** [paste your current text] + [paste the job posting or describe the target role]

**Method:**
1. Diagnose: what's weak about the current version in 2-3 bullets (vague verbs, no outcomes, buried lede).
2. Extract: identify the strongest quantifiable achievement hiding in it. If none exists, ask me 1-2 questions to surface one — do NOT fabricate.
3. Rewrite: 3 versions — concise, business-facing, technical. Impact-first, ATS-aware, truthful.
4. For each version: one line on when it works best.

**Hard rule:** Never invent metrics, titles, or scope. Truth, sharpened.

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Resume/Job. ${getStyleRules(target)} Emphasize ATS, truthfulness (never fabricate metrics), impact-first framing, and 3 output versions.`,
};
