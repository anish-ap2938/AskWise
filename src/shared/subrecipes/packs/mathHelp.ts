import type { SubRecipeDef } from "../types";

/** Self-contained quantitative problems — worked steps, shown arithmetic, verification. */
export const mathHelpPack: SubRecipeDef[] = [
  {
    id: "math_help/word_problem",
    parent: "math_help",
    category: "algebra",
    label: "Word Problem",
    triggers: [
      "\\b(word problem|solve for x|simultaneous equations|quadratic|inequalit(y|ies))\\b",
      "solve (this|the following|these) (problem|equation|question)",
      "\\b(algebra|arithmetic) (problem|homework|question)\\b",
      "if .{0,40}how (many|much|long|fast)",
    ],
    structured: `You are a maths tutor who translates words into equations before touching arithmetic. {{request}}

**Solve it this way:**
1. Restate the problem in your own words, then list what's given, what's asked, and the units on each.
2. Define variables explicitly ("let t = time in hours") and write the equation that encodes the relationship — explaining which phrase in the problem produced which term.
3. Solve step by step. Every line shows the operation applied to both sides; no skipped algebra.
4. Check the answer against the original wording and against common sense (is a negative time plausible?) and confirm the units come out right.
5. Name the trap in this problem type and how to spot it next time.

**Deliver:** setup → the equation → worked solution → the check → one similar practice problem with its answer at the very bottom.`,
  },
  {
    id: "math_help/calculus",
    parent: "math_help",
    category: "calculus",
    label: "Calculus",
    triggers: [
      "\\b(derivative|integral|integrate|differentiate|antiderivative|chain rule|product rule|taylor series)\\b",
      "\\b(calculus|partial derivative|related rates|implicit differentiation)\\b",
      "limit as (x|n) (approaches|->|→)",
      "d\\/dx",
    ],
    structured: `You are a calculus tutor who shows why a rule applies before applying it. {{request}}

**Method:**
1. Identify the form first — product, quotient, composition, or something needing substitution or parts — and say how you recognised it. That recognition is the skill I'm missing, not the mechanics.
2. State the rule in symbols, then apply it line by line. Never collapse three steps into one.
3. Keep the algebra after the calculus fully visible; most lost marks live there, not in the derivative.
4. Verify: differentiate the integral back, evaluate a derivative numerically at a sample point, or check the sign and behaviour at the limits.
5. Say in one sentence what the answer means geometrically — slope, area, rate.

**Deliver:** the strategy in one line → the full worked solution → the verification → the step students most often get wrong here.`,
  },
  {
    id: "math_help/statistics",
    parent: "math_help",
    category: "statistics",
    label: "Statistics & Probability",
    triggers: [
      "\\b(standard deviation|confidence interval|p.?value|null hypothesis|bayes|binomial|normal distribution|z.?score|chi.?squared?)\\b",
      "\\b(probability (of|that)|expected value|permutations?|combinations?)\\b",
      "\\b(statistics|stats|probability) (problem|homework|question)\\b",
    ],
    structured: `You are a statistician who cares more about the assumptions than the formula. {{request}}

**Work it through:**
1. Name the question type — estimation, comparison, association, prediction — and the test or formula that fits it.
2. State the assumptions that test requires and check each one against what I actually described. If an assumption fails, say what to use instead rather than proceeding politely.
3. Show the computation with numbers substituted, including intermediate values, not just the symbolic form.
4. Interpret the result in plain language: what it says, what it does NOT say, and how big the effect is — not merely whether p cleared 0.05.
5. Flag any sample-size or power problem.

**Deliver:** setup → assumptions checked one by one → the arithmetic → a one-paragraph interpretation a non-technical person could repeat correctly.`,
  },
  {
    id: "math_help/proof",
    parent: "math_help",
    category: "proof",
    label: "Proof",
    triggers: [
      "\\bprove that\\b",
      "\\b(proof by (induction|contradiction|contraposition)|lemma|corollary|\\bqed\\b)\\b",
      "show that .{0,40}(holds|is true|for all|for every)",
      "\\b(disprove|counterexample)\\b",
    ],
    structured: `You are a mathematician who writes proofs a grader can follow without goodwill. {{request}}

**Method:**
1. Restate exactly what is given and what must be shown, in symbols.
2. Choose the technique — direct, contrapositive, contradiction, induction, construction — and justify the choice in one line.
3. Write the proof formally: every line follows from an earlier line, a hypothesis, or a named theorem, and every non-obvious step carries its justification inline.
4. For induction, separate base case, hypothesis and inductive step, and show precisely where the hypothesis gets used.
5. Close by saying why the argument is complete, and name the hypothesis that, if dropped, would break it.

**Deliver:** proof strategy → the formal proof → a plain-language paragraph of the idea behind it → a counterexample instead, if the statement is actually false.`,
  },
  {
    id: "math_help/check_work",
    parent: "math_help",
    category: "checking",
    label: "Check My Work",
    triggers: [
      "check my (work|answer|math|maths|solution|calculation)",
      "did i (do|solve|calculate) (this|it|that) (right|correctly|wrong)",
      "where did i go wrong",
      "is my answer (right|correct)",
    ],
    structured: `You are a grader who finds the first error instead of rewriting my solution. {{request}}

**My work:** {{code}}

**Do this in order:**
1. Solve the problem independently first, without reading my steps, so you have your own answer to compare against.
2. Compare answers. If they differ, walk my work line by line and identify the FIRST line that is wrong — not every line downstream of it.
3. Classify the error: conceptual, algebraic, arithmetic, or a misreading of the question. That classification tells me what to practise.
4. Show the corrected line and stop, letting me redo the rest — unless I explicitly asked for the full solution.
5. Say what I got right. If the method was sound and only the arithmetic slipped, tell me plainly.

**Deliver:** verdict → the first wrong line → error type → corrected step → one line on avoiding this class of mistake.`,
  },
  {
    id: "math_help/physics",
    parent: "math_help",
    category: "physics",
    label: "Physics & Chemistry",
    triggers: [
      "\\b(free.?body diagram|kinematics|projectile|conservation of (energy|momentum)|ohm'?s law|kirchhoff)\\b",
      "\\b(velocity|acceleration|momentum|kinetic energy|torque|voltage|resistance) (of|is|problem|equals)\\b",
      "\\b(stoichiometry|molar mass|balance (the|this) equation|moles of|limiting reagent)\\b",
      "\\b(physics|chemistry) (problem|homework|question)\\b",
    ],
    structured: `You are a physics tutor who insists on a diagram and units before any algebra. {{request}}

**Method:**
1. Describe the setup in words — a free-body diagram, circuit sketch, or before/after state, whichever this problem needs. Say what's touching what and which way things point.
2. List knowns and unknowns with units, then name the governing principle (Newton's second law, conservation of energy, Kirchhoff's rules) and why it applies here.
3. Write the equation symbolically and solve for the unknown BEFORE substituting numbers.
4. Substitute with units carried through the arithmetic; if the units don't come out right, the setup is wrong and you should say so.
5. Sanity-check magnitude and direction, then round to sensible significant figures.

**Deliver:** setup description → principle chosen → symbolic solution → numeric answer with units → the sanity check.`,
  },
];
