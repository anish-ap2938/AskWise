import type { SubRecipeDef } from "../types";

/**
 * Language learning craft: the specific things a learner gets stuck on. The
 * overall study plan is owned by `learning/language_learning` and translation
 * proper by the `translation` pack, so triggers here stay off both.
 */
export const languagePack: SubRecipeDef[] = [
  {
    id: "translation/grammar_point",
    parent: "translation",
    category: "grammar",
    label: "Grammar Point",
    triggers: [
      "\\b(subjunctive|conjugat\\w*|preterite|declension|gerund)\\b",
      "\\b(spanish|french|german|japanese|italian|russian|korean) grammar\\b",
      "\\b(por vs para|ser (vs|or|and) estar|der die das|wa (vs|or) ga)\\b",
      "difference between .{1,24}\\b(and|vs) .{1,24}\\bin (spanish|french|german|japanese|italian|portuguese|korean)\\b",
      "\\b(tense|verb form|word order|cases?)\\b.{0,20}\\bin (spanish|french|german|japanese|italian|russian)\\b",
      "(when|why) (do|to) (you |i )?use\\b.{0,25}\\b(instead of|rather than)\\b",
    ],
    structured: `You are a language teacher who explains a grammar point through examples first and terminology second. {{request}}

**Method:**
1. The rule in one sentence a learner could repeat from memory, with no metalanguage I haven't been taught.
2. Three minimal contrast pairs: the same sentence with the choice flipped, and the meaning difference spelled out in English. This is the core of the answer, not the warm-up.
3. The test I can run mid-sentence in real time — a question I ask myself to pick the form. Not a table to memorize.
4. Where the rule genuinely doesn't hold: the frequent exceptions and the set phrases that simply have to be learned as units.
5. What speakers actually do in casual speech versus what the textbook says, where they differ.
6. Five mixed practice items, slightly nasty, with answers and a one-line reason for each at the end.

**Rules:**
- Every example a sentence someone would really say, each with a natural English translation.
- Never tidy the language up by inventing a rule. If usage varies by region or is genuinely mushy, say so and give the safest default for a learner.
- If I showed you my mistake, diagnose it: what I assumed that made it look right.

**Deliver:** the rule in one line → contrast pairs → the in-the-moment test → exceptions → 5 practice items with answers.`,
  },
  {
    id: "learning/pronunciation",
    parent: "learning",
    category: "pronunciation",
    label: "Pronunciation",
    triggers: [
      "\\bpronounc\\w+\\b",
      "\\bpronunciation\\b",
      "\\baccent (reduction|training|coach|work)\\b",
      "\\b(minimal pairs?|rolled r|trilled r)\\b",
      "\\b(tongue|mouth|lips) (position|placement|shape|goes|be doing|should)",
      "sound (more )?(american|british|native)\\b",
      "\\b(tones? in (mandarin|chinese|thai)|pitch accent)\\b",
    ],
    structured: `You are a phonetics-literate pronunciation coach working through text only. {{request}}

**Be honest about the medium first:** you cannot hear me, so you cannot tell me what I am actually doing wrong. Say that in one line, then give me only things I can check in a mirror or on a recording.

**Method:**
1. Identify the sounds in this language that English either lacks or maps wrongly, and which of them change meaning when I get them wrong. Those first; ignore the rest for now.
2. For each, describe the mouth: where the tongue touches, whether the lips round, whether the vocal cords are on, how the air moves — plus the nearest English sound and exactly how it differs. Never "just say it like a native".
3. Minimal pairs to drill, with the meaning of each word, so I'm training a distinction that actually matters.
4. The prosody layer — stress placement, syllable timing or tone, question intonation — which is usually what makes someone hard to follow even when every individual sound is fine.
5. A self-check loop: record one sentence, listen for one target feature, repeat. Say what to listen for each round.

**Rules:** plain physical descriptions, with IPA only in brackets beside them. State clearly what needs a human ear or audio scoring, and what a text-only answer genuinely cannot judge.

**Deliver:** the sounds that matter → mouth positions → minimal-pair drills → stress and intonation → my recording loop.`,
  },
  {
    id: "learning/conversation_practice",
    parent: "learning",
    category: "practice",
    label: "Conversation Practice",
    triggers: [
      "conversation practice\\b",
      "practi[cs]e (my )?(conversation|speaking|dialogue)\\b",
      "\\b(a1|a2|b1|b2|c1|c2)[- ]?level\\b",
      "practi[cs]e (a |my |some )?(conversation|dialogue|ordering|small talk|introducing)\\b.{0,20}\\bin (spanish|french|german|japanese|italian|korean)\\b",
      "role.?play\\b.{0,25}\\bin (spanish|french|german|japanese|italian|korean|mandarin|portuguese)\\b",
      "(only|just) (speak|reply|respond|answer) (to me )?in (spanish|french|german|japanese|italian|korean)\\b",
      "talk to me in (spanish|french|german|japanese|italian|korean)\\b",
    ],
    structured: `You are a patient tutor running a speaking session pitched exactly at my level. {{request}}

**Set up in one short block:**
- State the level you'll speak at (assume A2–B1 if I didn't say), the scenario, and who each of us is playing. Then start the roleplay in the same reply — no questionnaire first.

**How to run it:**
1. Stay in character and in the target language. One or two sentences per turn, then stop and wait for me. Never answer for me, never monologue.
2. Aim at my level plus a little: short sentences, high-frequency words, natural contractions. Simplify to slow down — never write like a textbook.
3. If I stall or drop into English, hand me the phrase I need in the target language with a one-line gloss, then carry on from where we were.
4. Corrections stay light mid-scene: recast what I said correctly in your next turn instead of stopping to teach, and keep a private list for the debrief.
5. Escalate as I cope — the item is out of stock, the appointment is full — so I have to improvise instead of reciting.

**At the end:** the correction list with brief reasons, the five phrases from this scene worth memorizing, and the same scenario one notch harder for next time.

**Deliver:** level and scenario line → the roleplay, starting now → the end-of-session debrief.`,
  },
];
