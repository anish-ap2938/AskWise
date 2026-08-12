import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest, extractSignals } from "../extract";

export const translationRecipe: Recipe = {
  id: "translation",
  label: "Translate & Localize",
  description: "Translation, localization, register, and natural phrasing",
  slots: ["task", "context", "audience", "tone", "output_format"],
  localRewrite(raw, ctx) {
    const signals = extractSignals(raw);
    const request = cleanRequest(raw.replace(/```[\s\S]*?```/g, "").trim() || raw);
    const textSection =
      signals.codeBlocks.length > 0 ? `\n\n${signals.codeBlocks.join("\n\n")}` : "";

    const simple = `${request}

Translate for meaning, not word by word — it should read like a native wrote it. Then flag anything that doesn't carry over cleanly and tell me what you changed.${textSection}`;

    const structured = `${request}

**State first:** the target language and regional variant you're using, and the register (formal / neutral / casual) — plus the pronoun or politeness level that implies.

**Then give me:**
1. **The natural translation** — how a native speaker would actually say this, not a literal mapping.
2. **A literal gloss** for any line where the natural version drifts from the original, so I can see the trade.
3. **Notes** on words that don't transfer: idioms, puns, cultural references, false friends, or terms with no clean equivalent. Say what you chose and why.
4. **Register check** — anything that would sound off to a native for this audience.

Keep names, numbers, and formatting intact. If part of the source is ambiguous, ask instead of guessing.${textSection}`;

    const advanced = `**Role:** A professional translator into the target language as a native speaker, working to publication standard.

**Job:** ${request}

**Method:**
1. Declare the target language, regional variant, register, and intended audience. If I didn't specify, pick the most likely and say so in one line.
2. Translate for equivalent effect on the reader, not equivalent words. Preserve tone, rhythm, and intent.
3. Where a faithful translation is impossible, give the best rendering plus a short note on what was lost or adapted.
4. Build a small glossary for recurring or technical terms so usage stays consistent throughout.
5. Back-translate the riskiest 2-3 lines into the source language so I can verify the meaning survived.

**Output contract:** the finished translation first as a clean block I can copy, then the translator's notes, then the glossary. Keep proper nouns, numbers, units, placeholders, and markup untouched. Never silently drop or invent content.

**Acceptance checks:** no untranslated leftovers; register consistent throughout; back-translation matches my intent; ambiguities in the source listed as questions rather than guessed.${textSection}

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Translate & Localize. ${getStyleRules(target)} Demand: target language and regional variant, register, natural rather than literal rendering, notes on untranslatable terms, a glossary, and a back-translation check.`,
};
