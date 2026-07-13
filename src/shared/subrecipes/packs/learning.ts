import type { SubRecipeDef } from "../types";

export const learningPack: SubRecipeDef[] = [
  {
    id: "quick_improve/eli5",
    parent: "quick_improve",
    label: "Explain Simply",
    triggers: ["like i'?m (five|5)", "eli5", "in simple (terms|words|language)", "simply", "for (a )?beginner", "basics of"],
    structured: `{{request}}

**How to teach it:**
1. One-sentence version a smart 12-year-old would get.
2. A real-world analogy that actually maps to how it works (say where the analogy breaks down).
3. Build up one level: the same idea with correct terms, each defined in a few words as introduced.
4. One concrete example or mini-scenario showing it in action.
5. The single most common misconception, corrected in one line.

No history lessons, no "it's complicated" hedging. Under 300 words.`,
  },
  {
    id: "quick_improve/deep_dive",
    parent: "quick_improve",
    label: "Deep Dive",
    triggers: ["in detail", "in depth", "deep dive", "thoroughly", "comprehensive", "step by step"],
    structured: `You are a brilliant teacher who builds understanding layer by layer. {{request}}

**Structure the explanation as:**
1. **The core idea** in 2-3 sentences — the mental model everything else hangs on.
2. **The mechanism**, step by step, with a running example carried through every step (same example throughout, not a new one each time).
3. **Why it works this way** — the constraint or trade-off that shaped it.
4. **Where it breaks** — limits, edge cases, common failure modes.
5. **Check my understanding:** end with 2 questions that test whether I really got it (answers at the bottom).

Define jargon inline the first time it appears. Depth over breadth — cut side topics.`,
  },
  {
    id: "quick_improve/study_plan",
    parent: "quick_improve",
    label: "Study Plan",
    triggers: ["study plan", "learn .{3,40} in \\d+", "roadmap (to|for) learn", "curriculum", "teach me .{3,40} (in|over|from)"],
    structured: `You are a learning coach who designs plans people actually finish. {{request}}

**Before planning, assume (and state) reasonable answers to:** my current level, hours/week available, and what "done" means for me — correct me if I gave these.

**The plan must have:**
1. Milestones, not topics: each week ends with something I can DO ("build X", "solve Y without notes"), not "understand Z".
2. The 80/20 cut: what you deliberately left out and why.
3. One primary resource per phase (not a list of ten) + practice that forces recall, not re-reading.
4. A weekly self-test so I catch falling behind by week 2, not month 2.

**Format:** week-by-week table → the single habit that most predicts finishing → what to do when (not if) I miss a week.`,
  },
  {
    id: "quick_improve/decision",
    parent: "quick_improve",
    label: "Decision Help",
    triggers: ["help me (decide|choose|pick)", "should i .{3,60} or", "can'?t decide", "torn between"],
    structured: `You are a decision coach — your job is to sharpen MY thinking, not to pick for me. {{request}}

**Method:**
1. Name the actual decision criteria hiding in how I phrased this (cost? risk? time? identity?) and ask me to confirm the top 2.
2. Steelman each option: the strongest honest case for it, in 3 bullets each.
3. Surface the asymmetries: which choice is reversible? which has the worse worst-case? what would I need to believe for each to be right?
4. Give me your read: which option the evidence favors and the ONE piece of information that would flip it.

No wishy-washy "it depends" endings — commit to a recommendation with your reasoning visible.`,
  },
  {
    id: "simple_answer/misconception",
    parent: "simple_answer",
    label: "Fact Check",
    triggers: ["is it true", "does .{3,50} (really|actually)", "myth", "true or false", "fact check"],
    structured: `{{request}}

Answer as a careful fact-checker:
- **Verdict first:** true / false / partly true — one line.
- **The evidence:** what the research or expert consensus actually says, in plain language (2-3 sentences).
- **Where the myth comes from**, if it's wrong — one line.
- Label anything uncertain as uncertain; don't flatten a contested question into false confidence.

Under 150 words total.`,
  },
];
