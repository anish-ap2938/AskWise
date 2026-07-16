export interface RefineChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RefineResult {
  reply: string;
  prompt: string | null;
}

export function buildRefineMessages(
  currentPrompt: string,
  history: RefineChatMessage[],
  userMessage: string
): { system: string; user: string } {
  const system = `You are AskWise's on-device prompt coach (gstack-style specialist editor). You improve AI prompts — you do NOT answer the user's underlying task.

You are given the current draft prompt and a short chat. The user may:
- suggest edits ("make it shorter", "add acceptance criteria"), or
- answer your clarifying questions.

When upgrading a prompt, push toward:
- a sharp expert ROLE (with safety limits for health/law/finance),
- a METHOD (reframe → assumptions → structure → risks),
- an OUTPUT CONTRACT + acceptance criteria,
- "do not invent" / uncertainty labeling for factual domains.

Rules:
- Keep the user's real intent and facts. Never invent specifics they didn't provide.
- Prefer at most 1 clarifying question when key info is missing; otherwise update the prompt.
- When you update the prompt, return the FULL replacement prompt (not a diff).
- Keep file/reference sections if they already exist in the draft.
- Reply in plain language (1–3 short sentences).
- Return ONLY valid JSON: {"reply":"...","prompt":null} or {"reply":"...","prompt":"full updated prompt"}`;

  const historyBlock =
    history.length === 0
      ? "(no prior turns)"
      : history
          .slice(-8)
          .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
          .join("\n");

  const user = `CURRENT DRAFT PROMPT:
<prompt>
${currentPrompt}
</prompt>

CHAT SO FAR:
${historyBlock}

USER: ${userMessage}`;

  return { system, user };
}

export function parseRefineContent(content: string): RefineResult {
  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Prefer full JSON parse; fall back to extracting fields if the small model drifts.
  try {
    const parsed = JSON.parse(cleaned) as {
      reply?: unknown;
      prompt?: unknown;
    };
    const reply =
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : "Updated.";
    const prompt =
      typeof parsed.prompt === "string" && parsed.prompt.trim()
        ? parsed.prompt.trim()
        : null;
    return { reply, prompt };
  } catch {
    const replyMatch = cleaned.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const promptMatch = cleaned.match(/"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (replyMatch) {
      return {
        reply: replyMatch[1]!.replace(/\\n/g, "\n").replace(/\\"/g, '"'),
        prompt: promptMatch
          ? promptMatch[1]!.replace(/\\n/g, "\n").replace(/\\"/g, '"')
          : null,
      };
    }
    // Last resort: treat the whole reply as chat, no prompt change.
    return { reply: cleaned.slice(0, 500) || "I couldn't update that — try again.", prompt: null };
  }
}
