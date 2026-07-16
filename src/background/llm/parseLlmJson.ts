export interface LlmRewriteResult {
  structured: string;
  advanced: string;
}

export function tryParsePartial(text: string): LlmRewriteResult | null {
  try {
    return parseJsonContent(text);
  } catch {
    const structuredMatch = text.match(/"structured"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (structuredMatch) {
      return {
        structured: structuredMatch[1]!.replace(/\\n/g, "\n").replace(/\\"/g, '"'),
        advanced: "",
      };
    }
    return null;
  }
}

export function parseJsonContent(content: string): LlmRewriteResult {
  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned) as LlmRewriteResult;
  if (!parsed.structured || !parsed.advanced) {
    throw new Error("Invalid JSON response from LLM");
  }
  return parsed;
}
