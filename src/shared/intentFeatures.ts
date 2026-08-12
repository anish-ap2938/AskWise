/**
 * Feature analyzer for the AskWise intent classifier.
 *
 * MUST stay byte-for-byte equivalent to training/lib_features.py.
 * Any change here requires the same change there (there is a parity test).
 */

const WORD_RE = /[a-z0-9']+/g;
const CODE_RE = /```[\s\S]*?```|`[^`]+`/;
const URL_RE = /https?:\/\//;
const TRACE_RE = /traceback|stacktrace|stack trace|line \d+/i;
const HTTPERR_RE = /\b(400|401|403|404|409|422|429|500|502|503|504)\b/;

const MAX_WORDS = 120;
const MAX_CHARGRAM_WORDS = 60;
const MAX_WORD_LEN = 24;

function wcBucket(n: number): string {
  if (n <= 3) return "a";
  if (n <= 8) return "b";
  if (n <= 15) return "c";
  if (n <= 30) return "d";
  if (n <= 60) return "e";
  return "f";
}

export function analyze(text: string): string[] {
  const lowered = text.toLowerCase();
  const words = (lowered.match(WORD_RE) ?? []).slice(0, MAX_WORDS);
  const toks: string[] = [];

  for (const w of words) toks.push(w);
  for (let i = 0; i + 1 < words.length; i++) toks.push(`${words[i]} ${words[i + 1]}`);

  for (const w of words.slice(0, MAX_CHARGRAM_WORDS)) {
    const s = ` ${w.slice(0, MAX_WORD_LEN)} `;
    for (const n of [3, 4, 5]) {
      if (s.length < n) continue;
      for (let i = 0; i + n <= s.length; i++) toks.push("#" + s.slice(i, i + n));
    }
  }

  if (CODE_RE.test(text)) toks.push("§code");
  if (URL_RE.test(lowered)) toks.push("§url");
  if (TRACE_RE.test(text)) toks.push("§trace");
  if (HTTPERR_RE.test(text)) toks.push("§httperr");
  if (/\?$/.test(text.replace(/\s+$/, ""))) toks.push("§q");
  toks.push("§wc" + wcBucket(words.length));
  if (words.length > 0) toks.push("§first_" + words[0]);

  return toks;
}
