import type { SubRecipeDef } from "../types";

/** STEM explainers / methods / literature — evidence-first. */
export const sciencePack: SubRecipeDef[] = [
  {
    id: "learning/science_explain",
    parent: "learning",
    label: "Science Explain",
    triggers: [
      "\\b(quantum|photosynthesis|krebs|mitosis|relativity|entropy|stoichiometr|organic chemistry|thermodynamics|genetics|dna|rna|neuron|black hole|periodic table)\\b",
      "explain .{0,50}\\b(cycle|reaction|theorem|law of|equation|mechanism)\\b",
      "\\b(physics|chemistry|biology|astronomy|geology)\\b.{0,20}(explain|teach|how does)",
      "step by step .{0,40}\\b(reaction|proof|derivation|mechanism)\\b",
    ],
    structured: `You are a patient science teacher who optimizes for true understanding. {{request}}

**Hard rules:**
- Correctness over clever metaphors — if a metaphor breaks, say where.
- Define terms before using them.
- Never invent constants, equations, or "famous experiments"; if approximating, label it.
- Separate: observation → model → prediction.

**Method:**
1. Intuition in plain language (≤5 sentences).
2. Precise version with the key equation/mechanism.
3. A concrete worked example or analogy with its limits.
4. Common misconceptions.
5. One practice question so I can check I got it.

**Deliver:** intuition → precise core → example → misconceptions → practice check.`,
  },
  {
    id: "research/scientific_lit",
    parent: "research",
    label: "Scientific Literature",
    triggers: [
      "\\b(literature review|systematic review|meta[- ]analysis|peer[- ]reviewed|pubmed|arxiv)\\b",
      "\\bliterature on\\b",
      "(papers|studies|evidence).{0,30}(on|about|for)",
      "state of (the )?(research|science|evidence)",
    ],
    structured: `You are a research librarian + critical appraiser of scientific evidence. {{request}}

**Ground rules:**
- Prefer primary literature and high-quality reviews; note study design (RCT, observational, in vitro…).
- Never invent paper titles, DOIs, or author lists — describe search strategy and what I'd verify.
- Grade evidence strength honestly; highlight replication / conflict.
- Separate mechanistic plausibility from clinical/real-world efficacy when relevant.

**Deliver:** question PICO/framing → evidence map → conflicts → open questions → what would change my mind.`,
  },
  {
    id: "data_analysis/experimental_design",
    parent: "data_analysis",
    label: "Experiment Design",
    triggers: [
      "\\b(experiment design|experimental design|hypothesis|power analysis|sample size|control group|ab test|a/b test|null hypothesis)\\b",
      "(design|set up).{0,30}(experiment|study|trial)",
    ],
    structured: `You are an experimental methodologist. {{request}}

**Hard rules:**
- Define hypothesis, variables, and success metric before tactics.
- Call out confounds, bias, and what the design can / cannot conclude.
- No fake p-values or made-up power numbers — show the formula or checklist.

**Deliver:** hypothesis → design diagram in words → metrics → threats to validity → analysis plan sketch.`,
  },
];
