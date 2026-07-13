import type { ModeId } from "./types";

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function hasCodeBlock(text: string): boolean {
  return /```[\s\S]*?```/.test(text) || /`[^`]+`/.test(text);
}

const ERROR_WORDS =
  /\b(error|bug|fix|not work(?:ing)?|won'?t (?:work|update|load|render|start|compile)|broken|fails?|failing|exception|traceback|stack ?trace|uncaught|unhandled|rejection|overflows?|segfault|crash(?:es|ing|ed)?|hangs?|freezes?|throws?|panics?|undefined|null ?pointer|memory leak|infinite loop|cors|time(?:s|d)? ?out|slow|duplicate|rerenders?|help|401|403|404|500|unauthorized|forbidden)\b/i;

// Optional single adjective between determiner and noun covers "my docker build",
// "my node app", "my recursive function" without loosening the determiner anchor.
const CODE_NOUN =
  /\b(my|this|the)\s+(?:\w+\s+)?(code|function|script|query|component|app|page|site|website|endpoint|api|api call|build|deploy(?:ment)?|test suite)\b/i;

const APP_VERBS = /\b(build|create|make|develop|write|code)\b/i;
const APP_NOUNS =
  /\b(app|application|web ?app|mobile app|website|web ?site|site|landing page|online store|e-?commerce (?:store|site)|marketplace|forum|tool|dashboard|crm|saas|platform|api|bot|chatbot|game|chrome extension|browser extension)\b/i;

const AGENT_VERBS =
  /\b(implement|refactor|migrate|rename|add (?:a )?(?:feature|auth(?:entication)?|login|pagination|dark mode|tests?|unit tests?|support for)|write (?:the code|unit tests?|tests? for)|optimi[sz]e (?:this|the|my)|dockeri[sz]e|containeri[sz]e|set ?up (?:ci|cd|ci\/cd|eslint|prettier|typescript|testing)|deploy (?:this|my|the)|upgrade (?:to|the|my)|convert (?:this|the|my)|clean up (?:the|this|my) code|fix this repo|update the code)\b/i;

const RESUME_WORDS =
  /\b(resume|cv|cover letter|bullet|linkedin (?:summary|profile|headline)|interview(?:s| answer| question| prep)?|job (?:application|offer|posting|description|search|hunt)|behavioral interview|tell me about yourself|ats|applicant tracking|recruiters?|hiring manager|salary negotiation|career (?:change|switch|transition)|resignation letter|portfolio review)\b/i;

const DATA_WORDS =
  /\b(sql|query|pandas|numpy|dataframe|excel|spreadsheet|dataset|analyz(?:e|es|ed|ing)?|chart|graph (?:of|the|this)|plot (?:of|the|this)|pivot|kpis?|metrics?|groupby|sales data|csv|visuali[sz](?:e|ation)|regression (?:model|analysis)|a\/b test|cohort|churn|forecast(?:ing)? (?:sales|revenue|demand))\b/i;

const RESEARCH_WORDS =
  /\b(research|compare|comparison|competitors?|market (?:size|share|analysis|for)|landscape|pros and cons|state of the art|literature(?: review)?|competitive landscape|\bvs\.?\b|versus|which (?:is|are|one'?s?) (?:better|best)|trends? in|find (?:me )?(?:papers|studies|sources)|benchmark)\b/i;

const WRITING_WORDS =
  /\b(email|essay|blog|post|caption|article|tweet|thread|newsletter|poem|poetry|story|slogan|tagline|\bbio\b|eulogy|vows|obituary|announcement|press release|apology|proofread|grammar|rewrite|paraphrase|tone|draft|paragraph|sound more|toast|speech|outline|letter to|script for)\b/i;

interface ClassifierRule {
  mode: ModeId;
  test: (t: string) => boolean;
}

function startsWithResearchVerb(text: string): boolean {
  return /^(research|compare)\b/i.test(text.trim());
}

const rules: ClassifierRule[] = [
  {
    mode: "coding_debug",
    test: (t) =>
      (hasCodeBlock(t) && ERROR_WORDS.test(t)) ||
      (CODE_NOUN.test(t) && ERROR_WORDS.test(t)),
  },
  {
    mode: "app_builder",
    test: (t) => !startsWithResearchVerb(t) && APP_VERBS.test(t) && APP_NOUNS.test(t),
  },
  {
    mode: "agent_task",
    test: (t) => AGENT_VERBS.test(t),
  },
  {
    mode: "resume_job",
    test: (t) => RESUME_WORDS.test(t),
  },
  {
    mode: "research",
    test: (t) => RESEARCH_WORDS.test(t) || startsWithResearchVerb(t),
  },
  {
    mode: "simple_answer",
    test: (t) =>
      /^(what|who|when|where|why|how|is|are|does|do|did|can|should)\b/i.test(t.trim()) &&
      wordCount(t) <= 12 &&
      !/\b(kpi|analyz|chart|pivot|dataset|dataframe|track|metrics?|a\/b test|pros and cons|state of the art)\b/i.test(t),
  },
  {
    mode: "data_analysis",
    test: (t) => DATA_WORDS.test(t),
  },
  {
    mode: "writing",
    test: (t) => WRITING_WORDS.test(t),
  },
];

export function classify(text: string): ModeId {
  const trimmed = text.trim();
  if (!trimmed) return "quick_improve";

  for (const rule of rules) {
    if (rule.test(trimmed)) {
      return rule.mode;
    }
  }

  return "quick_improve";
}
