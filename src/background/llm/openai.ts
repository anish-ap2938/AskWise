import type { ModeId, TargetModel } from "../../shared/types";
import { buildMetaPrompt } from "./metaPrompt";

export async function callOpenAI(
  apiKey: string,
  mode: ModeId,
  target: TargetModel,
  redactedPrompt: string
): Promise<{ structured: string; advanced: string }> {
  const { system, user } = buildMetaPrompt(mode, target, redactedPrompt);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1500,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const text = data.choices[0]?.message?.content ?? "";
    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}
