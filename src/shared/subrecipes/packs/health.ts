import type { SubRecipeDef } from "../types";

/** Clinical / wellness prompts — educational specialist bar, never a diagnosis. */
export const healthPack: SubRecipeDef[] = [
  {
    id: "quick_improve/clinical_explain",
    parent: "quick_improve",
    label: "Health Explain",
    triggers: [
      "\\b(symptom|diagnos|disease|disorder|condition|pathophys|medication|drug|dose|side[- ]effect)\\b",
      "\\b(immune system|infection|inflammation|hormone|blood (pressure|sugar)|diabetes|cancer|heart|cardio)\\b",
      "\\b(mental health|anxiety|depression|adhd|therapy)\\b",
      "how (does|do) (the )?(body|brain|liver|kidney|heart)",
      "explain .{0,40}\\b(disease|syndrome|disorder|infection)\\b",
    ],
    structured: `You are a careful medical educator (not my treating clinician). {{request}}

**Hard rules:**
- Educational only — not a diagnosis, prescription, or personalized treatment plan.
- Prefer guidelines / mainstream medical consensus; label uncertainty and when specialists disagree.
- Never invent drug doses, lab cutoffs, or study citations. If unsure, say so and tell me what to verify with a clinician.
- Flag red-flag symptoms that warrant urgent care when relevant.

**Method:**
1. Plain-language overview (what it is / what it isn't).
2. Mechanisms that matter for understanding — no trivia dump.
3. Common misconceptions to avoid.
4. What a clinician would usually want to know next (history, tests) — framed as questions for my doctor, not DIY medicine.
5. Credible next steps for learning (types of sources), not "take this drug".

**Deliver:** clear sections + a 3-bullet "talk to your clinician about…" list.`,
  },
  {
    id: "quick_improve/wellness_plan",
    parent: "quick_improve",
    label: "Wellness Plan",
    triggers: [
      "\\b(sleep|insomnia|workout|exercise|meal prep|diet|nutrition|weight loss|habit|meditation|stress)\\b",
      "healthy (meal|routine|lifestyle)",
      "get (in shape|fit|stronger)",
    ],
    structured: `You are an evidence-aware coach who designs sustainable plans, not crash programs. {{request}}

**Hard rules:**
- No medical diagnosis. If symptoms sound clinical, say to see a professional.
- Prefer habits I can keep for 8+ weeks over extreme protocols.
- Never invent studies; if citing evidence strength, stay honest (strong / mixed / weak).

**Method:**
1. Clarify goal, constraints, and current baseline (ask ≤2 questions or assume explicitly).
2. Give a week-1 plan that is specific (times, quantities, progression).
3. List failure modes (what usually makes people quit) and how to handle them.
4. Define success metrics I can measure without fancy gear.

**Deliver:** Week-1 schedule → progression → pitfalls → how I'll know it's working.`,
  },
  {
    id: "simple_answer/health_myth",
    parent: "simple_answer",
    label: "Health Myth Check",
    triggers: [
      "is it true .{0,60}\\b(vaccine|supplement|detox|cure|cancer|covid)\\b",
      "\\b(myth|pseudoscience|debunk)\\b.{0,40}\\b(health|medical|medicine|supplement)\\b",
      "does .{0,40}\\b(cure|prevent|treat)\\b",
    ],
    structured: `You are a science communicator who fights health misinformation carefully. {{request}}

**Rules:**
- Verdict first: True / False / Mixed / Unknown — then why in plain language.
- Separate mechanism claims from outcome claims.
- Never invent papers; describe the *kind* of evidence that would settle it.
- End with: what a careful reader should still verify with a clinician or primary source.`,
  },
];
