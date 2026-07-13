import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest } from "../extract";

export const writingRecipe: Recipe = {
  id: "writing",
  label: "Writing",
  description: "Emails, posts, essays, and creative writing",
  slots: ["audience", "tone", "length", "task", "constraints"],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);

    const simple = `${request}

Write it like a sharp human, not an AI: specific, direct, no filler phrases. Give me 2 versions with slightly different tones.`;

    const structured = `${request}

**Before writing, confirm (or assume and state):** who's reading this, what I want them to do/feel after reading, and how formal it should be.

**Style rules:**
- Sound like a competent human, not a press release — no "I hope this finds you well", no "delve", no bullet-point-itis
- Every sentence earns its place; cut the throat-clearing
- Specific beats general ("shipped 3 features" beats "made great progress")

**Deliver:** 2 versions — one direct, one warmer — and one line on when each works better.`;

    const advanced = `**Role:** Sharp editor and ghostwriter

**Task:** ${request}

**Process:**
1. State your read of: audience, purpose (what should the reader do/feel), and right level of formality. Ask me only if genuinely ambiguous.
2. Draft 2 versions: direct and warmer. Both must:
   - Open with the point, not context-setting
   - Use concrete specifics over abstractions
   - Sound like a person — zero corporate filler, zero AI-isms
3. After each: one line on when it's the better choice.
4. Flag anything where my ask conflicts with the goal (e.g., too long for the medium).

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Writing. ${getStyleRules(target)} Emphasize audience, purpose, human voice (no AI-isms), and 2 tonal versions.`,
};
