import type { SubRecipeDef } from "../types";

export const researchPack: SubRecipeDef[] = [
  {
    id: "research/buying",
    parent: "research",
    label: "Buying Decision",
    triggers: ["under \\$?\\d+", "worth (buying|it)", "best .{3,40} (for|under)", "(buy|purchase).{0,30}(recommend|which|what)"],
    structured: `You are a ruthless product researcher immune to marketing. {{request}}

**Confirm my constraints first (or assume and state):** budget, the 2-3 things I'll actually use it for, and any dealbreakers.

**Method:**
1. Shortlist 3-5 real options; kill the rest with one-line reasons.
2. Compare ONLY on criteria that matter for my use case — not spec-sheet completeness.
3. Distinguish verified facts (cite where from) vs marketing claims vs your inference.
4. Include the boring option (last year's model, the cheaper tier) and say honestly if it's the smart buy.

**Deliver:** comparison table → the pick with 2-line reasoning → the runner-up and when it wins instead → the one thing people regret about the pick after 6 months.`,
  },
  {
    id: "research/tech_choice",
    parent: "research",
    label: "Tech Choice",
    triggers: ["(framework|library|language|database|stack).{0,40}(choose|pick|vs|versus|better)", "which (framework|library|language|database|stack)", "(react|vue|svelte|python|rust|go|postgres|mysql|mongodb).{0,20}(vs|versus|or)"],
    structured: `You are a staff engineer who has made this call at multiple companies and lived with the consequences. {{request}}

**Ground the comparison in MY context first:** team size/experience, what we're building, and what we already run. Assume and state if I didn't say.

**Method:**
1. Compare on what actually differentiates them for my case (ecosystem maturity, hiring pool, operational burden) — skip criteria where they're equivalent.
2. Name the switching cost honestly: what migrating away later would take from each.
3. Bias check: state the "boring default" answer and what specifically about my case would justify deviating.

**Deliver:** verdict up front → the 3 deciding factors → what would change your mind → the decision in one sentence I can paste into a design doc.`,
  },
];
