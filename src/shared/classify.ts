import type { ModeId } from "./types";

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function hasCodeBlock(text: string): boolean {
  return /```[\s\S]*?```/.test(text) || /`[^`]+`/.test(text);
}

const ERROR_WORDS =
  /\b(error|bug|fix|not work(?:ing)?|won'?t (?:work|update|load|render|start|compile)|broken|fails?|failing|exception|traceback|stack ?trace|uncaught|unhandled|rejection|overflows?|segfault|crash(?:es|ing|ed)?|hangs?|freezes?|throws?|panics?|undefined|null ?pointer|memory leak|infinite loop|cors|time(?:s|d)? ?out|slow|duplicate|rerenders?|help|401|403|404|500|unauthorized|forbidden)\b/i;

const CODE_NOUN =
  /\b(my|this|the)\s+(?:\w+\s+)?(code|function|script|query|component|app|page|site|website|endpoint|api|api call|build|deploy(?:ment)?|test suite)\b/i;

const APP_VERBS = /\b(build|create|make|develop|write|code|ship|scaffold)\b/i;
const APP_NOUNS =
  /\b(app|application|web ?app|mobile app|website|web ?site|site|landing page|online store|e-?commerce (?:store|site)|marketplace|forum|tool|dashboard|crm|saas|platform|api|bot|chatbot|game|chrome extension|browser extension|ios app|android app|internal tool)\b/i;

const AGENT_VERBS =
  /\b(implement|refactor|migrate|rename|add (?:a )?(?:feature|auth(?:entication)?|login|pagination|dark mode|tests?|unit tests?|support for)|write (?:the code|unit tests?|tests? for)|optimi[sz]e (?:this|the|my)|dockeri[sz]e|containeri[sz]e|set ?up (?:ci|cd|ci\/cd|eslint|prettier|typescript|testing)|deploy (?:this|my|the)|upgrade (?:to|the|my)|convert (?:this|the|my)|clean up (?:the|this|my) code|fix this repo|update the code|pull request|open a pr)\b/i;

const RESUME_WORDS =
  /\b(resume|cv|cover letter|bullet|linkedin (?:summary|profile|headline)|interview(?:s| answer| question| prep)?|job (?:application|offer|posting|description|search|hunt)|behavioral interview|tell me about yourself|ats|applicant tracking|recruiters?|hiring manager|salary negotiation|career (?:change|switch|transition)|resignation letter|portfolio review)\b/i;

const DATA_WORDS =
  /\b(sql|query|pandas|numpy|dataframe|excel|spreadsheet|dataset|analyz(?:e|es|ed|ing)?|chart|graph (?:of|the|this)|plot (?:of|the|this)|pivot|kpis?|metrics?|groupby|sales data|csv|visuali[sz](?:e|ation)|regression (?:model|analysis)|a\/b test|cohort|churn|forecast(?:ing)? (?:sales|revenue|demand)|looker|tableau|power ?bi)\b/i;

const RESEARCH_WORDS =
  /\b(research|compare|comparison|competitors?|market (?:size|share|analysis|for)|landscape|pros and cons|state of the art|literature(?: review)?|competitive landscape|\bvs\.?\b|versus|which (?:is|are|one'?s?) (?:better|best)|trends? in|find (?:me )?(?:papers|studies|sources)|benchmark|shortlist)\b/i;

const WRITING_WORDS =
  /\b(email|essay|blog|post|caption|article|tweet|thread|newsletter|poem|poetry|story|slogan|tagline|\bbio\b|eulogy|vows|obituary|announcement|press release|apology|proofread|grammar|rewrite|paraphrase|tone|draft|paragraph|sound more|toast|speech|outline|letter to|script for|proposal|pitch deck copy|documentation|readme)\b/i;

const LEARNING_WORDS =
  /\b(explain|teach|tutor|eli5|like i(?:'?m| am) five|walk me through|how does .+ work|fundamentals of|crash course)\b/i;

function startsWithResearchVerb(text: string): boolean {
  return /^(research|compare)\b/i.test(text.trim());
}

function countMatches(text: string, re: RegExp): number {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  const global = new RegExp(re.source, flags);
  return [...text.matchAll(global)].length;
}

/** Scored classification — more modes can compete instead of first-rule-wins. */
export function classifyScores(text: string): Partial<Record<ModeId, number>> {
  const t = text.trim();
  const scores: Partial<Record<ModeId, number>> = {};

  const add = (mode: ModeId, n: number) => {
    if (n <= 0) return;
    scores[mode] = (scores[mode] ?? 0) + n;
  };

  if (
    (hasCodeBlock(t) && ERROR_WORDS.test(t)) ||
    (CODE_NOUN.test(t) && ERROR_WORDS.test(t))
  ) {
    add("coding_debug", 8);
  } else if (ERROR_WORDS.test(t) && /\b(code|function|react|typescript|python|java|api)\b/i.test(t)) {
    add("coding_debug", 4);
  }

  if (!startsWithResearchVerb(t) && APP_VERBS.test(t) && APP_NOUNS.test(t)) {
    add("app_builder", 7);
    if (/\b(mvp|saas|marketplace|dashboard|extension|ecommerce|e-?commerce)\b/i.test(t)) {
      add("app_builder", 2);
    }
  }

  if (AGENT_VERBS.test(t)) add("agent_task", 6);
  if (RESUME_WORDS.test(t)) add("resume_job", 7);
  if (RESEARCH_WORDS.test(t) || startsWithResearchVerb(t)) {
    add("research", 5 + Math.min(3, countMatches(t, RESEARCH_WORDS)));
  }
  if (
    /^(what|who|when|where|why|how|is|are|does|do|did|can|should)\b/i.test(t) &&
    wordCount(t) <= 12 &&
    !/\b(kpi|analyz|chart|pivot|dataset|dataframe|track|metrics?|a\/b test|pros and cons|state of the art)\b/i.test(
      t
    )
  ) {
    add("simple_answer", 6);
  }
  if (DATA_WORDS.test(t)) add("data_analysis", 5 + Math.min(2, countMatches(t, DATA_WORDS)));
  if (WRITING_WORDS.test(t)) add("writing", 5 + Math.min(2, countMatches(t, WRITING_WORDS)));
  if (LEARNING_WORDS.test(t) && wordCount(t) < 40) add("quick_improve", 2);

  // Disambiguation: research+compare of products vs writing a comparison essay
  if (/\b(essay|blog|article)\b/i.test(t) && /\bcompare\b/i.test(t)) {
    add("writing", 3);
    add("research", -2);
  }
  // Job hunt beats generic writing even if "draft" appears
  if (RESUME_WORDS.test(t) && WRITING_WORDS.test(t)) {
    add("resume_job", 2);
  }

  return scores;
}

export function classify(text: string): ModeId {
  const trimmed = text.trim();
  if (!trimmed) return "quick_improve";

  const scores = classifyScores(trimmed);
  let best: ModeId = "quick_improve";
  let bestScore = 0;
  for (const [mode, score] of Object.entries(scores) as Array<[ModeId, number]>) {
    if (score > bestScore) {
      best = mode;
      bestScore = score;
    }
  }
  return bestScore >= 4 ? best : "quick_improve";
}
