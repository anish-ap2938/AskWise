import type { SubRecipeDef } from "../types";

export const learningPack: SubRecipeDef[] = [
  {
    id: "learning/eli5",
    parent: "learning",
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
    id: "learning/deep_dive",
    parent: "learning",
    label: "Deep Dive",
    triggers: ["in detail", "in depth", "deep dive", "thoroughly", "comprehensive", "step by step"],
    structured: `You are a brilliant teacher who builds understanding layer by layer. {{request}}

**Pitch it for beginners** who are smart but new to this field.

**Structure the explanation as:**
1. **The core idea** in 2-3 sentences — the mental model everything else hangs on.
2. **The mechanism**, step by step, with a running example carried through every step (same example throughout, not a new one each time).
3. **Why it works this way** — the constraint or trade-off that shaped it.
4. **Where it breaks** — limits, edge cases, common failure modes.
5. **Check my understanding:** end with 2 questions that test whether I really got it (answers at the bottom).

**Constraints:** define jargon inline on first use; must carry one example throughout; avoid history sections and "it depends" hedging; keep it under 800 words — depth over breadth, so cut side topics rather than skim everything.

**Done means:** I could explain the mechanism to someone else without rereading.`,
  },
  {
    id: "learning/study_plan",
    parent: "learning",
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
    id: "learning/exam_prep",
    parent: "learning",
    category: "exam",
    label: "Exam Prep",
    triggers: [
      "\\b(exam|midterm|final|test) (prep|revision|tomorrow|next week)\\b",
      "cram(ming)? for",
      "\\b(gre|gmat|lsat|mcat|nclex|bar exam|cpa exam|ap exam)\\b",
      "\\b(sat|act) (prep|score|exam|test)\\b",
      "(study|studying) for (my|the|an?) (exam|test|final|midterm|certification)",
      "pass (the|my) .{0,25}(exam|test|certification)",
    ],
    structured: `You are a tutor who preps students for a fixed date, not for infinite mastery. {{request}}

**Assume and state:** [the exam and my date] plus what score or grade actually counts as a pass for me.

**Build the plan this way:**
1. Work backwards from exam day and reserve the last 15% of the time for review only — no new material in that window.
2. Triage the syllabus into must-know / likely / long-tail using how the exam really weights topics, and say where that weighting comes from.
3. Every session is retrieval: past papers and problems first, notes only to patch what I miss. No rereading.
4. Diagnostic in week 1 and again at the halfway point, both scored against the pass bar so I find out early.

**Deliver:** day-by-day schedule → the 10 highest-yield topics → what to do in the final 48 hours → what to abandon if I fall behind.`,
  },
  {
    id: "learning/lesson_plan",
    parent: "learning",
    category: "teaching",
    label: "Lesson Plan",
    triggers: [
      "lesson plan",
      "\\b(teaching|teach) (a|my|this) (class|lesson|unit|students)\\b",
      "\\b(syllabus|rubric|learning objectives|exit ticket)\\b",
      "curriculum for (a|my|the) (class|course|unit|semester)",
      "class of \\d+ (students|kids)",
    ],
    structured: `You are an experienced teacher who writes lesson plans another teacher could pick up and run cold. {{request}}

**Assume and state:** [grade level or audience] and [how long the session is].

**Plan structure:**
1. One measurable objective, phrased as what students will be able to DO by the end — not "understand".
2. A hook in the first five minutes that surfaces what they already (wrongly) believe about the topic.
3. Direct instruction capped at a third of the time; the rest is practice students do, not watch.
4. A formative check partway through, with the specific misconception you expect and how to correct it live.
5. Differentiation: one scaffold for students who stall, one extension for students who finish early.

**Deliver:** minute-by-minute timeline → materials list → the exit ticket that proves the objective was met → what to cut if the period runs short.`,
  },
  {
    id: "learning/language_learning",
    parent: "learning",
    category: "language",
    label: "Language Learning",
    triggers: [
      "learn(ing)? (spanish|french|german|italian|portuguese|japanese|korean|mandarin|chinese|arabic|russian|dutch|hindi|polish)",
      "\\b(duolingo|anki deck|conjugation|verb tenses|comprehensible input)\\b",
      "(become|get|sound) (fluent|conversational)",
      "practice (speaking|my) (spanish|french|german|japanese|korean|italian|english)",
      "language (learning|exchange|partner)",
    ],
    structured: `You are a polyglot coach who gets people speaking early instead of collecting grammar trivia. {{request}}

**Assume and state:** my current level (A1-C1, or none) and the minutes a day I can genuinely commit.

**Design the plan around:**
1. The core few hundred words that cover most daily speech, plus the 20 verbs I should be able to conjugate half-asleep.
2. Input I understand roughly 80% of — graded readers, children's shows, slowed podcasts — not native news on day one.
3. Output from week one: shadowing, then talking to myself, then a real conversation partner by week four.
4. Spaced repetition only for words I have already met in context, never a pre-made 5,000-word deck.
5. The pronunciation errors speakers of my native language make in this language, drilled early before they fossilize.

**Deliver:** a weekly routine → a 12-week ladder of concrete milestones ("order food", "argue about a film") → how I self-check each one.`,
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
    id: "learning/beginner_intro",
    parent: "learning",
    category: "onboarding",
    label: "Beginner Intro",
    triggers: [
      "^teach me (the )?basics",
      "\\bbasics of\\b",
      "\\bintro(duction)? to\\b",
      "where (do|should) i start with",
      "(absolute|complete|total) beginner",
      "\\bget started (with|in)\\b",
    ],
    structured: `You are a practitioner introducing a complete beginner to your field — you know which 20% is worth learning first. {{request}}

**Method:**
1. The one-paragraph map: what this field actually is, what people use it for, and the shape of the skill (mostly practice? mostly theory? mostly taste?).
2. The 5 concepts that unlock everything else — each in 2 sentences, no jargon left undefined.
3. The cheapest first project I can finish today with what I already own. Be specific about what I do, in order.
4. What beginners waste months on that you'd skip (gear, theory, tutorials) and why.
5. The signal I'm ready for the next level.

**Rules:** no history lesson, no exhaustive taxonomy, no "it depends". Recommend one path and own it.

**Deliver:** the map → 5 concepts → today's first project → what to skip → my next-level signal.`,
  },
  {
    id: "learning/topic_overview",
    parent: "learning",
    category: "overview",
    label: "Topic Overview",
    triggers: [
      "^summari[sz]e (the )?(causes|history|origins|timeline|key|main|argument|debate)",
      "\\b(causes|consequences|origins|timeline) of the\\b",
      "\\b(the )?rules of (cricket|chess|baseball|rugby|golf|poker|the game)\\b",
      "\\bexplain the rules\\b",
      "\\bgive me (an? )?overview of\\b",
      "\\bwhat led to\\b",
    ],
    structured: `You are a teacher who can make an unfamiliar topic click for someone starting from zero. {{request}}

**Structure:**
1. **The one-paragraph version** — if I remembered only this, I'd have the gist right.
2. **The core of it:** the 4-6 things that actually matter, each with the concrete detail that makes it stick (a date, a number, a name, an example). Ordered the way the topic works, not alphabetically.
3. **How the pieces relate** — cause and effect, or the sequence, stated explicitly rather than left as a list.
4. **The part outsiders always get wrong**, corrected in one line.
5. **Where it's contested:** if historians or experts genuinely disagree, say so and give both readings in a sentence each.

**Rules:** plain language, no invented dates or quotations, no "many factors contributed" filler. Under 400 words.`,
  },
  {
    id: "simple_answer/causal",
    parent: "simple_answer",
    category: "why",
    label: "Why Question",
    triggers: [
      "^why (is|are|do|does|did|don'?t|doesn'?t|can'?t)\\s+(?!my\\b|this\\b|our\\b)",
      "^what causes\\b",
      "\\bwhy do we\\b",
      "\\bwhat makes .{3,30} (happen|work)\\b",
    ],
    structured: `Answer this "why" question the way a good science teacher would — the actual mechanism, not a label. {{request}}

**Format:**
1. **The cause in one sentence** — the real driver, not a restatement of the question.
2. **The chain:** how that cause produces the effect, in 2-4 steps I can follow.
3. **One everyday observation** that confirms it (something I could notice myself).
4. **The popular wrong answer**, if there is one, and why it's wrong — one line.

**Rules:** if the honest answer is "we don't fully know", say that and give the leading explanation labeled as leading. Never invent studies or numbers. Under 200 words.`,
  },
  {
    id: "simple_answer/mechanism",
    parent: "simple_answer",
    category: "how",
    label: "How It Works",
    triggers: [
      "^how (does|do)\\s+(?!i\\b|we\\b|you\\b|my\\b)",
      "\\bhow (does|do) .{3,30} work\\b",
      "^how (is|are) .{3,30} (made|built|formed|produced)\\b",
      "\\bwhat happens when\\b",
    ],
    structured: `Explain the mechanism clearly enough that I could redraw it from memory. {{request}}

**Format:**
1. **The job it does** — what problem this thing solves, in one sentence.
2. **The walkthrough:** follow one concrete instance from start to finish (one packet, one photon, one dollar, one cell) through each stage. Same example the whole way through.
3. **The clever part** — the step that makes the whole thing possible, and why the obvious approach fails.
4. **One analogy**, plus the place the analogy breaks.

**Rules:** define each term as it appears, no acronym soup, no invented specifications. Under 250 words.`,
  },
  {
    id: "simple_answer/verdict",
    parent: "simple_answer",
    category: "yes_no",
    label: "Yes / No Verdict",
    triggers: [
      "^(is|are|was|were)\\s+(?!my\\b|this\\b|it\\b|there\\b)\\w+\\s+\\w+",
      "^(can|could|do|does|did|will|would|should)\\s+(?!you\\b|u\\b|i\\b|we\\b|my\\b|this\\b)\\w+",
      "^(is|are) it (safe|bad|normal|worth|okay|ok|legal|possible)\\b",
    ],
    structured: `Give me a straight answer, then the nuance. {{request}}

**Format:**
1. **Verdict on line one:** yes / no / mostly / it depends on X — one word or one clause, no preamble.
2. **Why**, in 2-3 sentences of the actual reasoning or evidence.
3. **The exception:** the case where the answer flips, if one exists.
4. If experts genuinely disagree or the evidence is thin, say so plainly instead of picking a side for confidence's sake.

**Rules:** never hedge your way out of committing when the answer is known. Never invent a study, statistic, or law to sound authoritative. Under 150 words.`,
  },
  {
    id: "simple_answer/fact_lookup",
    parent: "simple_answer",
    category: "fact",
    label: "Quick Fact",
    triggers: [
      "^who (invented|wrote|discovered|founded|created|built|painted|composed|is|was|won)\\b",
      "^when (was|were|did|does|do|is)\\b",
      "^how (many|much|long|old|tall|far|fast|big)\\b",
      "^where (is|are|was|were|do|does|did)\\b",
      "^what (year|century|day|percentage) \\b",
    ],
    structured: `Answer the factual question directly. {{request}}

**Format:**
1. **The answer first**, in one short sentence — name, date, number, or place.
2. **One or two lines of context** that make the fact meaningful rather than trivia.
3. **The caveat**, only if the fact is genuinely disputed, commonly misattributed, or depends on how you count. Say which convention you used.

**Rules:** never guess a number or date to seem helpful — if you're unsure, say so and give the range or the best-supported figure, labeled. Don't pad a one-line answer into paragraphs. Under 120 words.`,
  },
  {
    id: "simple_answer/term_compare",
    parent: "simple_answer",
    category: "compare",
    label: "Term Difference",
    triggers: [
      "^(what'?s|what is|whats) the difference between\\b",
      "\\bdifference between\\b.{0,40}\\band\\b",
      "\\b(vs\\.?|versus)\\b.{0,25}\\b(mean|means|meaning|difference)\\b",
      "^(is|are) .{3,25} the same as\\b",
    ],
    structured: `Draw the distinction cleanly — most explanations of this blur it. {{request}}

**Format:**
1. **The one-line distinction:** the single dimension that actually separates them.
2. **Side by side** on 3 dimensions that matter (what it is, what it's for, when you'd hit its limits) — a small table is fine.
3. **A concrete example of each**, close enough together that the contrast is obvious.
4. **The confusion:** where people mix them up, and the quick test to tell which one you're looking at.

**Rules:** don't list features neither side owns exclusively. If the two overlap or one contains the other, say so explicitly. Under 220 words.`,
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
