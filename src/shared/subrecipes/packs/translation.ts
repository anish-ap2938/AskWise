import type { SubRecipeDef } from "../types";

/** Moving text between languages and registers — meaning over literal words. */
export const translationPack: SubRecipeDef[] = [
  {
    id: "translation/translate",
    parent: "translation",
    category: "translate",
    label: "Translate Text",
    triggers: [
      "translate (this|the|it|my|into|to|from)",
      "\\btranslation (of|for) (this|the|my)\\b",
      "how do (you|i) say .{0,40} in (spanish|french|german|japanese|italian|portuguese|korean|chinese|mandarin|arabic|russian)",
      "\\b(english|spanish|french|german|japanese|chinese) (to|into) (english|spanish|french|german|japanese|chinese)\\b",
      "\\b(subtitles?|captions?) (in|into|for) \\w+",
    ],
    structured: `You are a professional translator who translates meaning, not words. {{request}}

**Method:**
1. State the source and target language, plus the register you're aiming for (formal, neutral, casual) inferred from the text's purpose. Ask only if it's genuinely ambiguous.
2. Translate for what a native speaker would actually say. Where a literal rendering would sound foreign, use the natural phrasing and note the swap.
3. Flag whatever resists translation — idioms, puns, culture-bound terms, names, honorifics, units, dates — and give your handling plus one alternative.
4. Preserve formatting, line breaks, and any placeholder tokens or variables exactly.

**Deliver:** the translation → a short notes list covering the judgement calls → a back-translation of any sentence where meaning could have shifted, so I can verify it without speaking the language.`,
  },
  {
    id: "translation/localize",
    parent: "translation",
    category: "localize",
    label: "Localize for a Market",
    triggers: [
      "\\blocali[sz]e\\b",
      "\\b(localization|localisation|l10n|i18n)\\b",
      "for (the )?(spanish|german|japanese|brazilian|french|mexican|latin american|uk) market",
      "sound natural to (a )?native",
      "adapt (this|the copy|our copy) for \\w+",
    ],
    structured: `You are a localization specialist who adapts copy for a market, not merely a language. {{request}}

**Assume and state:** [the target market and country] and who the reader is there.

**Adapt across four layers:**
1. Language: idiom, spelling and vocabulary for that specific market — Latin American versus Iberian Spanish, Brazilian versus European Portuguese, US versus UK English.
2. Conventions: dates, numbers, currency, units, address and phone formats, name order.
3. Culture: humour, directness, imagery and claims that land differently there, plus anything tone-deaf or legally risky in that market.
4. Content: swap examples, references and social proof for locally recognisable ones.

**Deliver:** the localized copy → a change log grouped by layer with the reason for each change → a sign-off list of items a local reviewer must confirm (legal claims, brand names, anything that could read as an accidental joke).`,
  },
  {
    id: "translation/formality",
    parent: "translation",
    category: "register",
    label: "Formality & Register",
    triggers: [
      "\\b(tu (vs|or) vous|t(ú|u) (vs|or) usted|du (vs|or) sie|keigo|honorifics)\\b",
      "(more|less|too) (formal|informal|polite|casual) in (spanish|french|german|japanese|korean|italian)",
      "\\b(formality|register) (in|for|of) (this|the|my)\\b",
      "\\bpolite form\\b",
    ],
    structured: `You are a native-speaker editor tuning register rather than meaning. {{request}}

**Method:**
1. Name the target register precisely in that language's own system — tu/vous, du/Sie, tú/usted, or the keigo level (teineigo, sonkeigo, kenjōgo) — and say what my relationship to the reader implies about the right choice.
2. Rewrite at that register properly: verb forms, honorifics, sentence endings, hedging, greetings and sign-off all move together, not just the pronoun.
3. Point out where my original would have landed wrong — too stiff, too familiar, accidentally curt — and what a native reader would infer about me from it.
4. Give the version one level up and one level down so I can choose.

**Deliver:** the rewritten text at the target register → the two neighbouring registers → a short note on when each one is the right call.`,
  },
  {
    id: "translation/phrase_meaning",
    parent: "translation",
    category: "meaning",
    label: "What Does This Phrase Mean",
    triggers: [
      "what does .{0,40} mean in (spanish|french|german|japanese|italian|latin|arabic|korean|portuguese)",
      "\\b(idiom|slang|colloquialism|literal translation)\\b",
      "meaning of the (phrase|expression|word)",
      "is .{0,30} (rude|an insult|offensive) in",
    ],
    structured: `You are a linguist who explains what people actually mean by a phrase, not what the dictionary says. {{request}}

**Explain in this order:**
1. The literal, word-by-word meaning, including the grammar, so I can see how the phrase is built.
2. What it means in real use, and how far that has drifted from the literal.
3. Register and connotation: who says this, to whom, and whether it's affectionate, rude, dated, regional, or fine at work. If it's an insult, say so plainly and rate how strong.
4. The closest natural English equivalent, plus a note on where the equivalence breaks.
5. Two example sentences in context with translations — one typical use, one borderline.

**Deliver:** literal → real meaning → register warning → English equivalent → examples. Tell me if the phrase is rare enough that I probably misheard it.`,
  },
];
