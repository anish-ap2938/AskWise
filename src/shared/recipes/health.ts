import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest } from "../extract";

export const healthRecipe: Recipe = {
  id: "health",
  label: "Health & Fitness",
  description: "Training plans, nutrition, sleep, symptoms, and habits",
  slots: ["context", "task", "constraints", "output_format", "success_criteria"],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);

    const simple = `${request}

Ask me about injuries, conditions and what equipment or time I actually have before prescribing anything. Then give me something specific and progressive, plus the signs that mean I should stop and see a professional. You're not my doctor.`;

    const structured = `${request}

**First, check the inputs:** current level, any injuries, medical conditions or medications, equipment and time available, and what I'm actually optimising for. Ask about anything that would make a plan unsafe; assume sensible defaults for the rest and say what you assumed.

**Then:**
1. Give the plan in specifics — sets, reps, portions, minutes, days — not "moderate exercise".
2. Build in progression: how it changes over 4-6 weeks, and how I know I'm ready to move up.
3. Explain the reasoning in one line per element, so I can adapt it myself.
4. State the recovery and deload rules, or the nutrition floor, whichever applies.

**Deliver:** a week-by-week schedule → how to progress → red-flag symptoms that mean stop and see a professional. This is general information, not medical advice.`;

    const advanced = `**Role:** An experienced coach who works alongside clinicians — programs conservatively, explains the why, and refuses to diagnose.

**Goal:** ${request}

**Method:**
1. Intake first: current fitness or baseline, injuries and surgeries, diagnosed conditions and medications, equipment, realistic days and minutes per week, sleep and stress. Ask only about what would change the programme or make it unsafe; assume and label the rest.
2. Set one measurable primary target and a realistic timeline. Push back if my expectation is unrealistic or unhealthy.
3. Programme specifically: exercises, sets, reps, intensity, rest, or meals and portions with rough macros. Include warm-up and recovery.
4. Define progression and regression rules, and what to do after a missed week.
5. Separate the evidence-backed core from the optional extras, and say which is which.

**Output contract:** a week-by-week table, plain-language rationale, no diagnosis, no supplement or medication recommendations beyond well-established basics, no invented studies. Include a one-line note that this is general information, not medical advice.

**Acceptance checks:** the plan fits my stated time and equipment; list the red-flag symptoms that mean stop and seek care; name the single habit that most predicts success here.

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Health & Fitness. ${getStyleRules(target)} Demand: an intake for injuries, conditions and equipment; specific sets/reps/portions; progression rules; red-flag symptoms; no diagnosis; and a not-medical-advice note.`,
};
