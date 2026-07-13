import type { ModeId, TargetModel } from "../../shared/types";
import { buildMetaPrompt } from "./metaPrompt";

export async function callAnthropic(
  apiKey: string,
  mode: ModeId,
  target: TargetModel,
  redactedPrompt: string
): Promise<{ structured: string; advanced: string }> {
  const { system, user } = buildMetaPrompt(mode, target, redactedPrompt);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1500,
        temperature: 0.3,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic error: ${response.status}`);
    const data = (await response.json()) as {
      content: Array<{ text: string }>;
    };
    const text = data.content[0]?.text ?? "";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleaned);
  } finally {
    clearTimeout(timeout);
  }
}
