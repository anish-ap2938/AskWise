import { intentProbabilities } from "./intentModel";
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

const LEARNING_STRONG =
  /\b(teach me|explain to me|walk me through|help me understand|eli5|like i(?:'?m| am) (?:five|5)|deep dive|crash course|fundamentals of|basics of|study (?:plan|guide|schedule)|curriculum|lesson plan|exam prep|revis(?:e|ion) for|flash ?cards|learning (?:path|roadmap)|roadmap (?:to|for) learn(?:ing)?|(?:want to|wanna|trying to|how do i|how to) learn|catch me up|(?:don'?t|dont|do not) (?:really )?(?:get|understand)|learn(?:ing)? [\w\s]{2,25} in \d+ (?:days?|weeks?|months?|years?))\b/i;
const LEARNING_EXPLAIN = /^(explain|teach|summari[sz]e the|break down|describe how)\b/i;
const LEARNING_DEPTH =
  /\b(in detail|in depth|step by step|with examples|thoroughly|comprehensive|from scratch|for (?:a )?beginners?|in simple terms|in plain english)\b/i;

const PLANNING_WORDS =
  /\b(itinerary|trip to|travel to|vacation|holiday (?:to|in)|weekend in|road trip|backpacking|where to stay|things to do in|plan (?:a|my|our) (?:trip|vacation|holiday|wedding|party|event|move|day|week|weekend)|wedding (?:day|planning|timeline|reception)|ceremony|birthday party|baby shower|dinner party|guest list|seating chart|meal (?:plan|prep|planning)|grocery list|what (?:should i|to) (?:cook|make|eat)|for dinner|recipe for|menu for|weekly schedule|daily (?:routine|schedule)|morning routine|evening routine|moving (?:to a|house|apartments?|homes?|out|cities|abroad)|packing list|checklist for|timeline of what)\b/i;

const MARKETING_WORDS =
  /\b(ad copy|ads? for|google ads|facebook ads|meta ads|ad campaign|ad script|(?:youtube|video|tv|radio|instagram|tiktok) ads?|landing page|headline and subhead|headlines? for (?:my|our|the) (?:landing|ad|home ?page|sales)|subhead|copywriting|sales copy|product descriptions?|tagline|slogan|brand (?:voice|positioning|messaging)|value prop(?:osition)?|seo|keyword research|rank (?:for|higher|on google)|meta description|backlinks?|content calendar|social media (?:strategy|calendar|plan)|email (?:campaign|sequence|funnel)|drip campaign|lead magnet|call to action|\bcta\b|conversion rate|customer acquisition|launch (?:campaign|announcement|plan)|influencers?|press kit|growth (?:hack|strategy|experiment)|first \d+ (?:users|customers)|get more (?:users|customers|traffic|subscribers|signups|followers)|subject lines?)\b/i;

const BUSINESS_WORDS =
  /\b(business (?:plan|model|case)|viable business|revenue model|monetiz(?:e|ation)|pricing (?:strategy|model|page|tiers?)|(?:how much|how|what) (?:should|do) (?:i|we) (?:charge|price)|unit economics|\bcac\b|\bltv\b|burn rate|runway|profit margin|break[- ]even|cash flow|product[- ]market fit|go[- ]to[- ]market|\bgtm\b|pitch deck|investor (?:deck|update|pitch)|fundrais(?:e|ing)|seed (?:round|pitch)|term sheet|cap table|equity split|co[- ]?founder|startup idea|validate (?:my|the|this) idea|\bprd\b|product requirements|product spec|user stories|\bokrs?\b|swot|competitive positioning|hiring plan|roadmap for (?:the|our|my|next)|white label|sop for)\b/i;

const FINANCE_WORDS =
  /\b(budget(?:ing)?|save up|savings? (?:account|rate|goal)|emergency fund|debt|pay(?:ing)? ?off (?:my |the )?(?:loan|debt|card|mortgage|balance)|credit (?:score|card debt)|student loans?|401k|403b|\bira\b|roth|pension|retirement|invest(?:ing|ment)?s?|index funds?|\betfs?\b|stocks? and bonds|mutual funds?|brokerage|mortgages?|refinanc(?:e|ing)|down payment|rent vs buy|renting (?:and|or|vs) buying|(?:health|car|auto|home|life|renters?|travel|term life) insurance|insurance (?:policy|premium|deductible|coverage)|tax(?:es)?|tax return|take[- ]home pay|net pay|paycheck|afford (?:a|to buy)|financial (?:plan|goal|freedom|independence|statements?)|net worth|cost of living)\b/i;

const HEALTH_WORDS =
  /\b(workout|work out|exercise|gym|training (?:plan|program|programme|schedule)|lifting|strength training|cardio|running plan|couch to 5k|(?:half )?marathon training|sets? of \d|calories?|macros?|protein|nutrition|diet|keto|weight loss|lose weight|lose \d+ ?(?:lbs?|pounds|kg|kilos)|gain muscle|bulking|cutting (?:weight|fat)|body ?fat|\bbmi\b|pull ?ups?|sleep better|insomnia|sleep schedule|waking up at|back to sleep|anxiety|burnout|mental health|therapy|meditat(?:e|ion)|symptoms?|diagnosed with|diabetes|blood pressure|cholesterol|(?:knee|back|shoulder|neck|wrist|ankle|hip|elbow|hamstring)s?\b[^.]{0,20}?\b(?:pain|hurts|hurting|ach(?:e|es|ing)|sore|stiff)|injur(?:y|ies|ed)|physical therapy|rehab|rotator cuff|posture|stay motivated to (?:exercise|work ?out|train|run)|get (?:in shape|fit)|hydration|vitamins?|supplements?)\b/i;

const MATH_WORDS =
  /\b(solve (?:for|this|the)|integral|derivative|differentiate|integrate|equations?|inequalit(?:y|ies)|algebra|calculus|trigonometry|geometry|logarithms?|quadratic|polynomial|factori[sz]e|simplify (?:this|the)|matri(?:x|ces)|eigenvalues?|probability (?:of|that)|permutations?|combinatorics|standard deviation|z[- ]score|confidence interval|hypothesis test|binomial|poisson|prove that|theorem|limit as|show (?:me )?(?:my|your|the) (?:work|steps|conversion)|check my (?:work|answer|math|maths|solution)|word problem|homework|problem set|significant figures|round to \d|\bmph\b|km\/h|area of (?:a|the)|(?:perimeter|circumference|volume|hypotenuse) of|triangle|how many (?:liters?|litres?|gallons?|grams?|kilograms?|kg|pounds?|lbs?|ounces?|miles?|kilometers?|km|meters?|metres?|feet|inches|cups|ml)\b)/i;

const TRANSLATION_WORDS =
  /\b(translat(?:e|es|ed|ing|ion)|locali[sz](?:e|ation)|how do you say|in (?:spanish|french|german|italian|portuguese|japanese|chinese|mandarin|korean|arabic|russian|hindi|dutch|polish|turkish|vietnamese|thai|swedish|greek|hebrew)\b|from english (?:to|into)|into english|subtitles?|sound(?:s)? natural to a native|native speaker|my (?:first|native) language|non[- ]native|formal (?:or|vs\.?) informal|keigo|tu (?:or|vs\.?) vous)/i;

const IMAGE_MODELS =
  /\b(midjourney|dall[- ]?e|stable diffusion|sdxl|flux|sora|veo|runway|kling|leonardo|ideogram|comfyui|img2img|txt2img|controlnet)\b/i;
const IMAGE_WORDS =
  /\b(image prompt|(?:logo|video|photo|thumbnail|art|character|scene) prompt|prompt for (?:an? )?(?:image|photo|picture|video|logo)|generate (?:an? )?(?:image|photo|picture|illustration|logo|video|thumbnail|poster|wallpaper|avatar|artwork)|(?:image|picture|photo|illustration|painting|render) of|negative prompt|aspect ratio|photo ?realistic|hyper ?realistic|concept art|character (?:sheet|design)|storyboard|album cover|book cover|thumbnails?|product shot|3d render|digital painting|\bai (?:art|image|video)\b)/i;

const ADVICE_WORDS =
  /\b(tips? (?:for|on|to)|advice (?:on|about|for)|get better at|gift ideas?|ideas? for|conversation starters?|brainstorm|icebreakers?|small talk|make friends|first date)\b/i;

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

  // ---- Domain modes -------------------------------------------------------
  // Added after the original modes so that ties resolve in favour of the
  // established ones (argmax keeps the first-inserted mode on an exact tie).

  const buildish = APP_VERBS.test(t) && APP_NOUNS.test(t);
  // Only a real debugging signal should block a domain mode — a bare noun
  // phrase like "the pricing page" or "my landing page" must not.
  const codeish =
    hasCodeBlock(t) || AGENT_VERBS.test(t) || (CODE_NOUN.test(t) && ERROR_WORDS.test(t));
  const dataish = DATA_WORDS.test(t);
  // "explain how mortgages work" is teaching, not a money decision.
  const explainish = LEARNING_STRONG.test(t) || LEARNING_EXPLAIN.test(t);
  // A short definitional question wants a fact, not a domain consultation.
  const definitional =
    /^(what|who|when|where) (?:is|are|was|were|does|do|did)\b/i.test(t) && wordCount(t) <= 12;

  if (!dataish && !codeish && !definitional) {
    if (LEARNING_STRONG.test(t)) {
      add("learning", 7 + Math.min(2, countMatches(t, LEARNING_STRONG)));
    } else if (LEARNING_EXPLAIN.test(t)) {
      add("learning", LEARNING_DEPTH.test(t) ? 8 : 7);
    }
  }

  const lifestyleOk =
    !buildish && !codeish && !definitional && !explainish && !startsWithResearchVerb(t);
  if (lifestyleOk) {
    if (PLANNING_WORDS.test(t)) {
      add("planning", 7 + Math.min(2, countMatches(t, PLANNING_WORDS)));
    }
    if (MARKETING_WORDS.test(t)) {
      add("marketing", 7 + Math.min(2, countMatches(t, MARKETING_WORDS)));
    }
    if (BUSINESS_WORDS.test(t)) {
      add("business", 7 + Math.min(2, countMatches(t, BUSINESS_WORDS)));
    }
    if (HEALTH_WORDS.test(t)) {
      add("health", 7 + Math.min(2, countMatches(t, HEALTH_WORDS)));
    }
    if (!dataish && FINANCE_WORDS.test(t)) {
      add("finance", 7 + Math.min(2, countMatches(t, FINANCE_WORDS)));
    }
  }

  // These three carry keywords precise enough to survive a short question.
  // A math term with no problem attached is a concept question, not homework.
  const conceptual = /\b(?:don'?t|dont|do not) (?:really )?(?:get|understand)\b/i.test(t);
  if (!dataish && !codeish && !conceptual && MATH_WORDS.test(t)) {
    add("math_help", 7 + Math.min(2, countMatches(t, MATH_WORDS)));
  }
  if (!dataish && !codeish && TRANSLATION_WORDS.test(t)) {
    add("translation", 8 + Math.min(2, countMatches(t, TRANSLATION_WORDS)));
  }
  if (!codeish) {
    if (IMAGE_MODELS.test(t)) add("image_gen", 9);
    else if (IMAGE_WORDS.test(t)) add("image_gen", 7 + Math.min(2, countMatches(t, IMAGE_WORDS)));
  }

  // Residual advice / idea-generation catch-all, scored last so any domain
  // mode above wins the tie.
  if (!buildish && !codeish && !dataish && ADVICE_WORDS.test(t)) {
    add("quick_improve", 7);
  }

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

/** Rule score at or above which the keyword patterns decide on their own. */
const RULE_TRUST = 8;
/** How many rule-points a fully confident model prediction is worth. */
const ML_WEIGHT = 2;
/** Minimum blended score required to leave the quick_improve fallback. */
const DECIDE_MIN = 2;
/**
 * When no rule fires at all, the blended score can't clear DECIDE_MIN on the
 * model's contribution alone. This is the probability at which we accept the
 * model's call unaided rather than falling back to quick_improve.
 */
const MODEL_MIN_P = 0.6;

export interface Classification {
  mode: ModeId;
  /** Which signal decided the mode. */
  via: "rules" | "model" | "blend" | "fallback";
  score: number;
}

function argmax(scores: Partial<Record<ModeId, number>>): { mode: ModeId; score: number } {
  let mode: ModeId = "quick_improve";
  let score = 0;
  for (const [m, s] of Object.entries(scores) as Array<[ModeId, number]>) {
    if (s > score) {
      mode = m;
      score = s;
    }
  }
  return { mode, score };
}

export function classifyDetailed(text: string): Classification {
  const trimmed = text.trim();
  if (!trimmed) return { mode: "quick_improve", via: "fallback", score: 0 };

  const rules = classifyScores(trimmed);
  const top = argmax(rules);

  // High-precision keyword patterns encode product intent — don't let the
  // statistical model overrule them.
  if (top.score >= RULE_TRUST) {
    return { mode: top.mode, via: "rules", score: top.score };
  }

  const probs = intentProbabilities(trimmed);
  if (!probs) {
    return top.score >= DECIDE_MIN
      ? { mode: top.mode, via: "rules", score: top.score }
      : { mode: "quick_improve", via: "fallback", score: top.score };
  }

  const blended: Partial<Record<ModeId, number>> = { ...rules };
  for (const [mode, p] of Object.entries(probs) as Array<[ModeId, number]>) {
    blended[mode] = (blended[mode] ?? 0) + ML_WEIGHT * p;
  }

  const best = argmax(blended);
  if (best.score >= DECIDE_MIN) {
    return {
      mode: best.mode,
      via: (rules[best.mode] ?? 0) > 0 ? "blend" : "model",
      score: best.score,
    };
  }

  const mlTop = argmax(probs);
  if (mlTop.score >= MODEL_MIN_P) {
    return { mode: mlTop.mode, via: "model", score: mlTop.score };
  }
  return { mode: "quick_improve", via: "fallback", score: best.score };
}

export function classify(text: string): ModeId {
  return classifyDetailed(text).mode;
}
