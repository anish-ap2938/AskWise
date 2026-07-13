import type { ExtractedSignals } from "./types";

/** Common typos / grammar slips people type into AI chats. Applied after filler strip. */
const TYPO_FIXES: Array<[RegExp, string]> = [
  [/\band app\b/gi, "an app"],
  [/\ba app\b/gi, "an app"],
  [/\ba api\b/gi, "an api"],
  [/\ban website\b/gi, "a website"],
  [/\bteh\b/gi, "the"],
  [/\badn\b/gi, "and"],
  [/\bwana\b/gi, "wanna"],
  [/\bwud\b/gi, "would"],
  [/\bu\b(?=\s+(?:to|can|could|help|make|build|write|fix))/gi, "you"],
  [/\brecieve\b/gi, "receive"],
  [/\bseperate\b/gi, "separate"],
  [/\boccurence\b/gi, "occurrence"],
  [/\bdefinately\b/gi, "definitely"],
  [/\baccomodate\b/gi, "accommodate"],
  [/\bwich\b/gi, "which"],
  [/\bwhats\b/gi, "what's"],
  [/\bdont\b/gi, "don't"],
  [/\bcant\b/gi, "can't"],
  [/\bwont\b/gi, "won't"],
  [/\bim\b/gi, "I'm"],
  [/\bi\b/g, "I"],
  [/\s{2,}/g, " "],
];

function fixCommonTypos(text: string): string {
  let t = text;
  for (const [re, replacement] of TYPO_FIXES) {
    t = t.replace(re, replacement);
  }
  return t.trim();
}

/** Strip conversational filler so templates can reuse the user's actual request. */
export function cleanRequest(raw: string): string {
  let t = raw.trim();
  // Leading filler: "i want to", "can you", "please", "help me", "hey can u" ...
  t = t.replace(
    /^(hey|hi|hello|yo|ok|okay|so|um|uh)[,.!\s]+/i,
    ""
  );
  t = t.replace(
    /^(please\s+)?(can|could|will|would)\s+(you|u)\s+(please\s+)?/i,
    ""
  );
  t = t.replace(/^(i\s+(want|need|would like|wanna|wud like)\s+(to|a|an)?\s*)/i, "");
  t = t.replace(/^(help\s+me\s+(to\s+)?|please\s+)/i, "");
  t = fixCommonTypos(t.trim());
  if (!t) return fixCommonTypos(raw.trim()) || raw.trim();
  // Capitalize first letter
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function extractSignals(raw: string): ExtractedSignals {
  const codeBlocks: string[] = [];
  const codeRe = /```[\s\S]*?```/g;
  let m: RegExpExecArray | null;
  while ((m = codeRe.exec(raw)) !== null) {
    codeBlocks.push(m[0]);
  }

  const verbs: string[] = [];
  const verbRe =
    /\b(explain|build|create|make|write|analyze|research|fix|debug|implement|compare|draft|rewrite|help|give|summarize|teach|migrate|refactor)\b/gi;
  while ((m = verbRe.exec(raw)) !== null) {
    verbs.push(m[0].toLowerCase());
  }

  const techLexicon = [
    "typescript",
    "javascript",
    "python",
    "react",
    "next.js",
    "sql",
    "postgres",
    "prisma",
    "tailwind",
    "excel",
    "pandas",
  ];
  const technologies = techLexicon.filter((t) =>
    new RegExp(`\\b${t.replace(".", "\\.")}\\b`, "i").test(raw)
  );

  const audienceMatch = raw.match(
    /\b(for (beginners|my manager|recruiters?|ats)|audience:?\s*([^.\n]+))/i
  );
  const toneMatch = raw.match(/\b(formal|casual|professional|friendly)\b/i);

  const subject = raw
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[^\w\s]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 8)
    .join(" ");

  return {
    subject: subject || raw.trim(),
    verbs: [...new Set(verbs)],
    codeBlocks,
    technologies,
    audience: audienceMatch?.[0],
    tone: toneMatch?.[0],
  };
}

export function wordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}
