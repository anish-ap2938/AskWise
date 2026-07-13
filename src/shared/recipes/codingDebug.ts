import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest, extractSignals } from "../extract";

// gstack /investigate style: no fixes without investigation, root cause first,
// minimal patch, preserve the user's approach.
export const codingDebugRecipe: Recipe = {
  id: "coding_debug",
  label: "Coding Debug",
  description: "Debug code errors and failures",
  slots: ["task", "context", "constraints", "output_format"],
  localRewrite(raw, ctx) {
    const signals = extractSignals(raw);
    const request = cleanRequest(raw.replace(/```[\s\S]*?```/g, "").trim() || raw);
    const codeSection =
      signals.codeBlocks.length > 0
        ? signals.codeBlocks.join("\n\n")
        : "[paste your code AND the exact error message / wrong output here]";

    const simple = `Debug this: ${request}

Find the root cause before proposing any fix. Then give a minimal patch — preserve my approach.

${codeSection}`;

    const structured = `Act as a senior engineer debugging with me. Issue: ${request}

**Iron rule: no fixes without investigation.**
1. Read the code and the error. State the root cause in one paragraph — the actual mechanism, not "it might be X".
2. If you can't determine the root cause from what I gave you, tell me exactly what to check or log (max 3 things) instead of guessing.
3. Give the minimal fix — smallest change that solves it. Preserve my approach unless it's fundamentally broken, and say so if it is.
4. Explain in 2-3 lines why the fix works and how to confirm it.

${codeSection}`;

    const advanced = `**Role:** Senior engineer, systematic debugger

**Issue:** ${request}

**Method (in order, no skipping):**
1. **Reproduce mentally:** trace the exact code path that produces this error.
2. **Root cause:** one paragraph, the actual mechanism. If evidence is insufficient, list the max 3 checks/logs I should run — do NOT guess-fix.
3. **Minimal patch:** smallest possible change. No drive-by refactoring, no style changes, preserve my approach.
4. **Verify:** how I confirm the fix worked, and one regression case to watch.
5. **Prevention:** one line — how to avoid this class of bug.

${codeSection}

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Coding Debug. ${getStyleRules(target)} The rewrite must demand root-cause investigation before any fix, a minimal patch, and "preserve my approach". Keep the user's code blocks verbatim.`,
};
