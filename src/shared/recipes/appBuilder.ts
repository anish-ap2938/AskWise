import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest, extractSignals } from "../extract";

// gstack/office-hours style: push back on framing, force assumptions into the
// open, propose the narrowest shippable wedge, demand a plan before code.
export const appBuilderRecipe: Recipe = {
  id: "app_builder",
  label: "App Build",
  description: "Build apps, tools, dashboards, and platforms",
  slots: [
    "task",
    "tech_stack",
    "architecture",
    "schema",
    "testing",
    "acceptance_criteria",
  ],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);
    const signals = extractSignals(raw);
    const stackLine =
      signals.technologies.length > 0
        ? `I'm already using: ${signals.technologies.join(", ")}. Build on that unless there's a strong reason not to.`
        : `Propose a stack with a one-line justification for each choice. Prefer boring, proven tools.`;

    const simple = `${request}

Start by asking me the 2-3 most important questions about who this is for and what problem it solves. Then propose the smallest useful version I could ship this week, the tech stack, and the file structure — before writing any code.`;

    const structured = `You are a senior product engineer. Here's what I want: ${request}

**Before writing any code:**
1. State your understanding of the real problem this solves in one sentence. If my framing hides a simpler or better product, push back and say so.
2. Ask me up to 3 clarifying questions (target user, core pain, what "success" looks like). Make reasonable assumptions for anything I don't answer and state them explicitly.
3. Propose the narrowest useful version (the wedge) I could ship in days — then the full vision as later milestones.

**Then propose:**
- ${stackLine}
- Data model and the 3-5 main screens/flows
- Milestone plan, each with acceptance criteria I can verify myself

**Rules:** No over-engineering. No feature code until I approve the plan. When you make a choice, explain the trade-off in one line.`;

    const advanced =
      ctx.targetModel === "claude"
        ? `<role>Senior product engineer and pragmatic technical cofounder</role>
<request>${request}</request>
<process>
  1. Reframe: state the real problem in one sentence; push back if a narrower or better product is hiding inside my request.
  2. Interrogate: ask up to 3 forcing questions (user, pain, success metric). State assumptions explicitly for anything unanswered.
  3. Wedge: propose the smallest version shippable in days, then the full vision as ordered milestones.
  4. Plan: data model, main screens/flows, tech stack (one-line justification each — ${signals.technologies.length > 0 ? `I already use ${signals.technologies.join(", ")}` : "prefer boring, proven tools"}).
  5. Implement milestone by milestone only after I approve; after each, list what to run and what I should see.
</process>
<constraints>No over-engineering. Explain trade-offs in one line. Never write feature code before plan approval.</constraints>
<acceptance_criteria>Each milestone ends with a checklist I can verify without reading code.</acceptance_criteria>
<self_check>Before finishing each milestone: does it run, do error and empty states exist, would a new user understand the UI without explanation?</self_check>`
        : `**Role:** Senior product engineer and pragmatic technical cofounder

**My request:** ${request}

**Process — in this order:**
1. **Reframe.** State the real problem in one sentence. If a narrower or better product is hiding in my request, push back.
2. **Interrogate.** Ask up to 3 forcing questions (target user, core pain, success metric). State assumptions for anything I don't answer.
3. **Wedge.** Propose the smallest version shippable in days, then the full vision as ordered milestones.
4. **Plan.** Data model, main screens/flows, tech stack with one-line justifications (${signals.technologies.length > 0 ? `I already use ${signals.technologies.join(", ")}` : "prefer boring, proven tools"}).
5. **Build.** Implement milestone by milestone only after I approve the plan. After each milestone, tell me what to run and what I should see.

**Rules:** No over-engineering. One-line trade-off explanations. Each milestone ends with acceptance criteria I can verify myself. No feature code before plan approval.`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: App Builder. ${getStyleRules(target)} Rewrite in the style of a YC office-hours session: reframe the problem, force assumptions into the open, propose the narrowest shippable wedge, and require a plan with acceptance criteria before any code.`,
};
