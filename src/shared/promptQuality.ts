/**
 * Shared quality bar for AskWise rewrites.
 * Inspired by Garry Tan / gstack (role specialists + forcing questions +
 * hard gates) and STCO-style contracts (Situation, Task, Constraints, Output).
 */

/** Universal scaffold appended to Advanced variants when a sub-recipe omits one. */
export const EXPERT_RIGOR_FOOTER = `**Quality contract (non-negotiable):**
- Restate my goal in one sentence before answering so I can correct a misread.
- If a critical detail is missing, ask up to 2 sharp questions — otherwise state assumptions in one line and proceed.
- Prefer concrete, verifiable deliverables over vague advice.
- Label uncertainty: established fact vs contested vs your inference.
- Include a short self-check: how I verify the answer is good enough.
- End with the single most important next step.
- Never invent facts, citations, numbers, legal/medical advice, or credentials.`;

/**
 * Fallback "how to answer" block for generic Quick Improve — used when no
 * domain sub-recipe matches. Keeps the user's request as the hero.
 */
export function expertHowToAnswerBlock(): string {
  return `**How to answer (expert mode):**
1. **Reframe:** Restate what I'm asking and what "done" looks like in one sentence.
2. **Gaps:** Ask up to 2 clarifying questions only if they change the answer; else state assumptions.
3. **Method:** Use a clear structure (headings / numbered steps). Lead with the answer, then the reasoning.
4. **Constraints:** Call out risks, trade-offs, and what NOT to do.
5. **Proof:** Prefer examples, numbers, or checks I can verify — no filler I could get from a search result.
6. **Close:** One next action + a 3-bullet self-check that the answer met the goal.`;
}

/** Extra pressure for Tier-2 / Refine system prompts. */
export const META_QUALITY_BAR = `Quality bar (write prompts like a demanding specialist lead — gstack / STCO style):
- Keep the user's actual request as the core — never bury it under template scaffolding.
- Assign a sharp expert ROLE only when it changes depth or standards (doctor-educator ≠ clinician diagnosing; not a lawyer giving advice).
- Force a METHOD: reframe → assumptions/questions → structured answer → risks → acceptance criteria.
- Demand an OUTPUT CONTRACT: format, length/depth, what to include, what to refuse or flag.
- Domain safety: for health/law/finance/science, require disclaimers, jurisdiction/evidence limits, and "do not invent".
- Use at most 1-2 [bracketed placeholders], only for essential missing inputs.
- Natural prose with light structure — not empty Task:/Context:/Format: wallpaper.`;
