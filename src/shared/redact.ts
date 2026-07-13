import type { RedactionMatch, RedactionResult } from "./types";

const PATTERNS: Array<{ type: string; regex: RegExp }> = [
  { type: "openai_key", regex: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { type: "anthropic_key", regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { type: "github_token", regex: /\bghp_[A-Za-z0-9]{20,}\b/g },
  { type: "slack_token", regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { type: "aws_key", regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { type: "jwt", regex: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g },
  { type: "password", regex: /\b(password|passwd|token|secret)\s*[=:]\s*\S+/gi },
  {
    type: "credit_card",
    regex: /\b(?:\d[ -]*?){13,19}\b/g,
  },
  { type: "ssn", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: "email", regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { type: "phone", regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
  {
    type: "ipv4",
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
  },
];

function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]!, 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function shannonEntropy(s: string): number {
  const freq: Record<string, number> = {};
  for (const c of s) {
    freq[c] = (freq[c] ?? 0) + 1;
  }
  let entropy = 0;
  const len = s.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function isHighEntropySecret(s: string): boolean {
  if (s.length < 24) return false;
  if (!/^[A-Za-z0-9+/=_-]+$/.test(s)) return false;
  return shannonEntropy(s) > 4.0;
}

let tokenCounter = 0;

function makeToken(type: string): string {
  tokenCounter += 1;
  return `⟦REDACTED:${type}:${tokenCounter}⟧`;
}

export function redactSecrets(text: string): RedactionResult {
  const matches: RedactionMatch[] = [];
  const map: Record<string, string> = {};
  let redacted = text;
  const seen = new Set<string>();

  const addMatch = (original: string, type: string) => {
    if (seen.has(original)) return;
    seen.add(original);
    const token = makeToken(type);
    map[token] = original;
    matches.push({ type, original, token });
    redacted = redacted.split(original).join(token);
  };

  for (const { type, regex } of PATTERNS) {
    const re = new RegExp(regex.source, regex.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const original = m[0];
      if (type === "credit_card" && !luhnCheck(original)) continue;
      addMatch(original, type);
    }
  }

  const entropyRe = /\b[A-Za-z0-9+/=_-]{24,}\b/g;
  let em: RegExpExecArray | null;
  while ((em = entropyRe.exec(text)) !== null) {
    const original = em[0];
    if (isHighEntropySecret(original)) {
      addMatch(original, "high_entropy");
    }
  }

  return { redacted, matches, map };
}

export function restoreRedactions(text: string, map: Record<string, string>): string {
  let restored = text;
  for (const [token, original] of Object.entries(map)) {
    restored = restored.split(token).join(original);
  }
  return restored;
}

export function resetRedactionCounter(): void {
  tokenCounter = 0;
}
