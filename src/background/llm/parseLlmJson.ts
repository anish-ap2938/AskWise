export interface LlmRewriteResult {
  structured: string;
  advanced: string;
}

function decodeJsonStringFragment(value: string): string {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}

function extractField(text: string, field: string): string {
  const complete = text.match(
    new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`)
  );
  if (complete?.[1]) return decodeJsonStringFragment(complete[1]);

  const partial = text.match(
    new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)$`)
  );
  return partial?.[1] ? decodeJsonStringFragment(partial[1]) : "";
}

export function tryParsePartial(text: string): LlmRewriteResult | null {
  try {
    return parseJsonContent(text);
  } catch {
    const structured = extractField(text, "structured");
    const advanced = extractField(text, "advanced");
    if (structured || advanced) {
      return {
        structured,
        advanced,
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
