import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest } from "../extract";

// gstack /ship + Karpathy rules: verifiable goals, minimal diffs, no orthogonal
// edits, investigate before fixing.
export const agentTaskRecipe: Recipe = {
  id: "agent_task",
  label: "Agent Task",
  description: "Implementation tasks for coding agents",
  slots: ["task", "constraints", "acceptance_criteria", "self_check"],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);

    const simple = `Implement this — don't just describe how: ${request}

Minimal diff, no unrelated changes. When done, tell me exactly how to verify it works.`;

    const structured = `**Task:** ${request}

**Do it — don't suggest it.** Rules:
1. Before coding: state your plan in 3-5 bullets. If any architectural choice is ambiguous, ask — don't guess.
2. Minimal diff: touch only what the task requires. No drive-by refactors, no style cleanup, no "while I was here".
3. After coding: run the relevant tests/build. If you can't run them, say exactly what I should run.
4. Report: what changed (file by file), how to verify it works, and anything you noticed but deliberately didn't touch.

If you get blocked, tell me what's blocking you and what you need — don't work around it silently.`;

    const advanced = `**Task:** ${request}

**Operating rules (Karpathy-style):**
1. **No wrong assumptions:** state your plan and key assumptions in 3-5 bullets before touching code. Ambiguous architectural decision → ask, don't guess.
2. **No overcomplexity:** simplest implementation that fully solves it. No new abstractions unless the task demands them.
3. **No orthogonal edits:** minimal diff. Zero unrelated refactoring, formatting, or "improvements".
4. **Verify, don't hope:** run tests/build after. Can't run them? Give me the exact commands.

**Definition of done:**
- [ ] Works for the main case AND the obvious edge case
- [ ] Existing tests still pass; new behavior has a test if the project has a test setup
- [ ] You've listed every file changed and why

**Report format:** root cause / approach (1 para) → files changed → how to verify → what you deliberately left alone.

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Agent Task. ${getStyleRules(target)} The rewrite must demand: plan-before-code, minimal diff, no orthogonal edits, verification steps, and a definition of done.`,
};
