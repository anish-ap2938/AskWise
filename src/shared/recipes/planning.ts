import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest } from "../extract";

export const planningRecipe: Recipe = {
  id: "planning",
  label: "Plan & Organize",
  description: "Trips, events, schedules, routines, and meal plans",
  slots: ["task", "context", "constraints", "output_format", "success_criteria"],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);

    const simple = `${request}

Give me a plan I can actually follow: real times and costs, decisions already made for me, and what to do when something falls through. No generic "consider your options" advice.`;

    const structured = `${request}

**Start by stating the constraints you're assuming** — dates, budget, how many people, and any hard must-haves. Flag which one you'd need from me if it would change the plan.

**Build the plan so that:**
- Every item has a rough time and cost, not just a name
- You commit to specific choices and say why, instead of listing five options
- Related things are grouped so I'm not backtracking
- Each phase has one fallback for the thing most likely to go wrong

**Deliver:** a schedule or itinerary in order → a total cost estimate → what to book or buy first → the 3 things people most often forget.`;

    const advanced = `**Role:** A planner who has run this exact kind of thing many times and optimizes for it actually happening, not for looking thorough.

**Goal:** ${request}

**Method:**
1. State the constraints you're assuming (dates, budget, group size, energy level, hard requirements). Ask only if a missing one would change the shape of the plan.
2. Decide the structure first — the sequence and the anchors — before filling in detail.
3. Commit to specific picks with a one-line reason each. Where a real trade-off exists, name it and still choose.
4. Pressure-test: what breaks if the weather turns, someone cancels, or it costs 20% more?

**Output contract:** an ordered schedule with times and costs, a running total, a "book/buy in this order" list, and a packing or prep checklist. No option paralysis — one recommendation per slot with at most one alternate.

**Acceptance checks:** the plan fits the stated budget and time; nothing requires being in two places at once; every booking with a deadline is called out.

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Plan & Organize. ${getStyleRules(target)} Demand: explicit constraints, an ordered schedule with times and costs, committed choices over option lists, contingencies, and a prep checklist.`,
};
