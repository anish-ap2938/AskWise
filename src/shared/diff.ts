import type { ScoreResult } from "./types";

export interface DiffSegment {
  text: string;
  type: "same" | "added";
}

const MAX_TOKENS = 1200;

function tokenize(text: string): string[] {
  // Keep whitespace attached to tokens so joining reconstructs the text exactly.
  return text.match(/\S+\s*/g) ?? [];
}

function normalize(token: string): string {
  return token.trim().toLowerCase().replace(/[.,;:!?"'`*_\[\]()]+$/g, "").replace(/^[.,;:!?"'`*_\[\]()]+/g, "");
}

/**
 * Word-level diff of the rewritten prompt against the original: which words of
 * the rewrite were kept from the user's text vs added by AskWise.
 * Uses LCS; falls back to a single "added" segment for very large inputs.
 */
export function diffRewrite(original: string, rewritten: string): DiffSegment[] {
  const a = tokenize(original).map(normalize);
  const b = tokenize(rewritten);
  const bNorm = b.map(normalize);

  if (a.length === 0 || b.length === 0 || a.length * b.length > MAX_TOKENS * MAX_TOKENS) {
    return [{ text: rewritten, type: "added" }];
  }

  // LCS table (small inputs only — guarded above).
  const n = a.length;
  const m = b.length;
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] =
        a[i] === bNorm[j] && a[i] !== ""
          ? dp[i + 1]![j + 1]! + 1
          : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }

  // Walk the table, tagging tokens of `b` as kept (same) or added.
  const tagged: Array<{ text: string; same: boolean }> = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === bNorm[j] && a[i] !== "") {
      tagged.push({ text: b[j]!, same: true });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      i++;
    } else {
      tagged.push({ text: b[j]!, same: false });
      j++;
    }
  }
  while (j < m) {
    tagged.push({ text: b[j]!, same: false });
    j++;
  }

  // Merge adjacent tokens of the same type into segments.
  const segments: DiffSegment[] = [];
  for (const t of tagged) {
    const type = t.same ? "same" : "added";
    const last = segments[segments.length - 1];
    if (last && last.type === type) {
      last.text += t.text;
    } else {
      segments.push({ text: t.text, type });
    }
  }
  return segments;
}

const FIX_LABELS: Record<string, string> = {
  task_clarity: "direct task",
  specificity: "specifics",
  context: "context",
  output_format: "output format",
  constraints: "constraints",
  audience_tone: "audience",
  success_criteria: "success criteria",
  right_sized: "right-sizing",
  citations: "citations",
  recency: "recency",
};

/**
 * One-line, human-readable summary of what the rewrite fixed, derived from the
 * score breakdown deltas (deterministic — no LLM involved).
 */
export function summarizeFix(before: ScoreResult, after: ScoreResult): string {
  const ratio = (r: ScoreResult, id: string): number => {
    const s = r.breakdown.find((b) => b.id === id);
    return s && s.max > 0 ? s.score / s.max : 0;
  };

  const fixed: string[] = [];
  for (const signal of after.breakdown) {
    if (ratio(before, signal.id) < 0.5 && ratio(after, signal.id) >= 0.5) {
      fixed.push(FIX_LABELS[signal.id] ?? signal.label.toLowerCase());
    }
  }

  const lift = after.total - before.total;
  if (fixed.length === 0) {
    return lift > 0 ? `Sharpened wording (+${lift} pts)` : "Already a strong prompt";
  }

  const list =
    fixed.length <= 3
      ? fixed.join(", ")
      : `${fixed.slice(0, 3).join(", ")} +${fixed.length - 3} more`;
  return `Added ${list} (+${lift} pts)`;
}
