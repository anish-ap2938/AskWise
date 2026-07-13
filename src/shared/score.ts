import type { ModeId, ScoreResult, SignalScore } from "./types";
import { wordCount } from "./classify";

interface SignalDef {
  id: string;
  label: string;
  weight: number;
  /** Returns 0..1 — partial credit, not binary. */
  detect: (text: string) => number;
}

const IMPERATIVE_VERBS =
  /\b(explain|build|create|make|write|analyze|research|fix|debug|implement|compare|draft|rewrite|summarize|teach|design|generate|review|refactor|optimize|translate|convert|plan)\b/i;

const VAGUE_OPENERS =
  /^(i want|i need|i would like|can you|could you|help me|please|hey|hi|so)\b/i;

const TECH_TERMS =
  /\b(typescript|javascript|python|java|rust|golang|react|vue|svelte|next\.?js|node|sql|postgres|mysql|mongodb|redis|api|rest|graphql|docker|kubernetes|aws|azure|gcp|excel|pandas|numpy|tensorflow|figma|tailwind|css|html)\b/i;

const FORMAT_SIGNAL =
  /\b(format|as a (list|table)|in (a )?(list|table|json|markdown|bullet)|step[- ]by[- ]step|numbered|json|markdown|table|outline|bullet points?|give me \d+ (versions?|options?|examples?)|structure|milestones?|deliver:?|checklist|headings?|\d+ versions?)\b|\n\s*(\d+\.|[-*])\s/i;

const CONSTRAINT_SIGNAL =
  /\b(must|must not|only|avoid|don'?t|do not|no more than|at (least|most)|max(imum)?|min(imum)?|limit|under \d+|within|keep it|exactly|strictly|never|without|rules?:?|up to \d+|hard rule)\b/i;

const AUDIENCE_TONE =
  /\b(for (beginners?|experts?|kids|my (manager|boss|team|client)|a \w+ audience)|beginner[- ]friendly|non[- ]technical|technical audience|target (user|audience)|formal|casual|professional|friendly|concise|eli5|like i'?m (5|five|new|smart but new))\b/i;

const SUCCESS_EXAMPLES =
  /\b(e\.g\.|for example|for instance|such as|should include|success looks like|criteria|like this:|similar to|here'?s an example|definition of done|what "?good"? looks like|verify)\b/i;

const CONTEXT_MARKERS =
  /\b(i'?m (a|an|working|building|trying)|my (goal|project|app|team|company|situation|use case)|context:|background:|currently|we (use|have|are)|because|since i|state (your|every) assumptions?|clarifying questions?)\b/i;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

const BASE_SIGNALS: SignalDef[] = [
  {
    id: "task_clarity",
    label: "Clear, direct task",
    weight: 15,
    detect: (t) => {
      const hasVerb = IMPERATIVE_VERBS.test(t);
      if (!hasVerb) return 0;
      // Full credit only if the request doesn't hide behind filler.
      const firstWords = t.trim().split(/\s+/).slice(0, 4).join(" ");
      if (IMPERATIVE_VERBS.test(firstWords)) return 1;
      if (VAGUE_OPENERS.test(t.trim())) return 0.5;
      return 0.7;
    },
  },
  {
    id: "specificity",
    label: "Specific details",
    weight: 20,
    detect: (t) => {
      let score = 0;
      const wc = wordCount(t);
      if (wc >= 15) score += 0.3;
      else if (wc >= 8) score += 0.15;
      if (TECH_TERMS.test(t)) score += 0.25;
      if (/\d/.test(t)) score += 0.2; // numbers = concrete
      if (/[A-Z][a-z]+[A-Z]|\b[A-Z]{2,}\b/.test(t)) score += 0.1; // proper nouns/acronyms
      // Named features/entities ("with X, Y and Z")
      if (/\bwith\b.*\b(and|,)\b/i.test(t)) score += 0.15;
      return clamp01(score);
    },
  },
  {
    id: "context",
    label: "Context / background",
    weight: 15,
    detect: (t) => {
      let score = 0;
      if (CONTEXT_MARKERS.test(t)) score += 0.5;
      if (/```[\s\S]*?```/.test(t)) score += 0.5; // pasted code/data
      if (/\b(who|audience|user)s?\b.*\b(is|are)\b/i.test(t)) score += 0.2;
      return clamp01(score);
    },
  },
  {
    id: "output_format",
    label: "Output format",
    weight: 15,
    detect: (t) => (FORMAT_SIGNAL.test(t) ? 1 : 0),
  },
  {
    id: "constraints",
    label: "Constraints / boundaries",
    weight: 10,
    detect: (t) => (CONSTRAINT_SIGNAL.test(t) ? 1 : 0),
  },
  {
    id: "audience_tone",
    label: "Audience / tone",
    weight: 10,
    detect: (t) => (AUDIENCE_TONE.test(t) ? 1 : 0),
  },
  {
    id: "success_criteria",
    label: "Examples / success criteria",
    weight: 10,
    detect: (t) => (SUCCESS_EXAMPLES.test(t) ? 1 : 0),
  },
  {
    id: "right_sized",
    label: "Right-sized (no bloat, no fragments)",
    weight: 5,
    detect: (t) => {
      const wc = wordCount(t);
      if (wc < 4) return 0; // fragment
      if (wc > 400) return 0; // bloat
      return 1;
    },
  },
];

const RESEARCH_EXTRA: SignalDef[] = [
  {
    id: "citations",
    label: "Citations requested",
    weight: 10,
    detect: (t) => (/\b(cite|sources?|references?|link)\b/i.test(t) ? 1 : 0),
  },
  {
    id: "recency",
    label: "Recency specified",
    weight: 10,
    detect: (t) => (/\b(recent|current|latest|20\d\d|up[- ]to[- ]date|this year)\b/i.test(t) ? 1 : 0),
  },
];

const MODE_WEIGHT_OVERRIDES: Partial<Record<ModeId, Partial<Record<string, number>>>> = {
  simple_answer: { constraints: 0, success_criteria: 5, specificity: 10, right_sized: 15 },
  quick_improve: { right_sized: 10 },
  coding_debug: { context: 25, audience_tone: 0 }, // pasted code is what matters
  app_builder: { specificity: 25, output_format: 10 },
};

function getBand(total: number): ScoreResult["band"] {
  if (total >= 70) return "strong";
  if (total >= 40) return "okay";
  return "weak";
}

const MISSING_HINTS: Record<string, string> = {
  task_clarity: "Lead with a direct verb (build / explain / fix), not \"I want\"",
  specificity: "Add specifics: names, numbers, features, tech",
  context: "Say who it's for or what you're working on",
  output_format: "Say what shape you want (list, table, steps, code...)",
  constraints: "Add boundaries (must / avoid / max length...)",
  audience_tone: "Name the audience or tone",
  success_criteria: "Give an example or say what \"good\" looks like",
  right_sized: "Too short to be answerable (or too long — trim it)",
  citations: "Ask for sources",
  recency: "Ask for recent information",
};

export function scorePrompt(text: string, mode: ModeId): ScoreResult {
  const signals: SignalDef[] =
    mode === "research" ? [...BASE_SIGNALS, ...RESEARCH_EXTRA] : [...BASE_SIGNALS];

  const overrides = MODE_WEIGHT_OVERRIDES[mode] ?? {};

  const breakdown: SignalScore[] = [];
  let total = 0;
  let maxTotal = 0;
  const missing: string[] = [];

  for (const signal of signals) {
    const weight = overrides[signal.id] ?? signal.weight;
    if (weight === 0) continue;

    maxTotal += weight;
    const ratio = clamp01(signal.detect(text));
    const score = Math.round(ratio * weight);
    total += score;

    breakdown.push({ id: signal.id, label: signal.label, score, max: weight });

    if (ratio < 0.5) {
      missing.push(MISSING_HINTS[signal.id] ?? `No ${signal.label.toLowerCase()}`);
    }
  }

  const normalized = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;

  return {
    total: normalized,
    breakdown,
    missing,
    band: getBand(normalized),
  };
}
