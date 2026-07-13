import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest, wordLimit } from "../extract";

export const simpleAnswerRecipe: Recipe = {
  id: "simple_answer",
  label: "Simple Answer",
  description: "Definitional questions needing concise answers",
  slots: ["task", "audience", "length"],
  localRewrite(raw, _ctx) {
    const request = cleanRequest(raw);

    const simple = `${request} — explain it simply, with one small concrete example. Skip the theory.`;

    const structured = `${request}

Explain it like I'm smart but new to this topic:
- One-paragraph plain-language answer first
- Then one small concrete example
- Define any jargon in a few words as you go
- Keep the whole thing short — no history lessons, no unnecessary caveats`;

    const advanced = wordLimit(
      `${request} Answer in plain language for a newcomer: core idea in one paragraph, one concrete example, jargon defined inline. Under 150 words total. End with the one thing worth remembering.`,
      60
    );

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Simple Answer. ${getStyleRules(target)} The improved prompt must ask for a SHORTER, clearer answer — never a longer one. Advanced variant must stay under 60 words.`,
};
