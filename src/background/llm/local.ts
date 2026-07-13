import type { StorageSchema } from "../../shared/types";
import { restoreRedactions } from "../../shared/redact";

export interface LlmRewriteResult {
  structured: string;
  advanced: string;
}

export async function callLocalLlm(
  providers: StorageSchema["providers"],
  system: string,
  user: string,
  onChunk?: (text: string) => void
): Promise<LlmRewriteResult> {
  const baseUrl = providers.local.baseUrl.replace(/\/$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    // Qwen3 reasoning models burn tokens on "thinking" unless disabled.
    const isQwen3 = /qwen3/i.test(providers.local.model);
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: providers.local.model,
        temperature: 0.3,
        max_tokens: 700,
        stream: !!onChunk,
        response_format: { type: "json_object" },
        ...(isQwen3 ? { think: false } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!response.ok) {
      throw new LocalLlmError(response.status, await response.text());
    }

    if (onChunk && response.body) {
      return parseStream(response.body, onChunk);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content?: string; reasoning?: string } }>;
    };
    const message = data.choices[0]?.message;
    const content = message?.content?.trim() || message?.reasoning?.trim() || "";
    return parseJsonContent(content);
  } finally {
    clearTimeout(timeout);
  }
}

export class LocalLlmError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "LocalLlmError";
  }
}

async function parseStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void
): Promise<LlmRewriteResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data) as {
          choices: Array<{ delta: { content?: string } }>;
        };
        const chunk = parsed.choices[0]?.delta?.content ?? "";
        accumulated += chunk;
        const partial = tryParsePartial(accumulated);
        if (partial?.structured) onChunk(partial.structured);
      } catch {
        // skip malformed chunks
      }
    }
  }

  return parseJsonContent(accumulated);
}

function tryParsePartial(text: string): LlmRewriteResult | null {
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

function parseJsonContent(content: string): LlmRewriteResult {
  const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(cleaned) as LlmRewriteResult;
  if (!parsed.structured || !parsed.advanced) {
    throw new Error("Invalid JSON response from LLM");
  }
  return parsed;
}

export async function detectOllama(
  baseUrl: string
): Promise<{ ok: boolean; status: number; models: string[] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 800);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      return { ok: false, status: response.status, models: [] };
    }
    const data = (await response.json()) as { models: Array<{ name: string }> };
    return {
      ok: true,
      status: response.status,
      models: data.models?.map((m) => m.name) ?? [],
    };
  } catch {
    return { ok: false, status: 0, models: [] };
  } finally {
    clearTimeout(timeout);
  }
}

export function applyRedactionRestore(
  result: LlmRewriteResult,
  map: Record<string, string>
): LlmRewriteResult {
  return {
    structured: restoreRedactions(result.structured, map),
    advanced: restoreRedactions(result.advanced, map),
  };
}
