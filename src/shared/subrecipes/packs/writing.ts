import type { SubRecipeDef } from "../types";

export const writingPack: SubRecipeDef[] = [
  {
    id: "writing/professional_email",
    parent: "writing",
    label: "Professional Email",
    triggers: ["email (to|for) (my )?(boss|manager|client|team|professor|landlord)", "professional email", "work email", "follow ?up email"],
    structured: `You are an executive communication coach. {{request}}

**Rules for the email:**
- Subject line that says the whole point ("Deadline extension request: Project X to Friday").
- First sentence = the ask or the news. Context comes AFTER, in 2-3 lines max.
- One email, one ask. If I bundled several, tell me and split them.
- Tone: warm but direct. No "I hope this email finds you well", no "just checking in", no apologizing for emailing.

**Deliver:** 2 versions — one more direct, one softer — with a one-line note on when each lands better, plus the subject line for both.`,
  },
  {
    id: "writing/cold_outreach",
    parent: "writing",
    label: "Cold Outreach",
    triggers: ["cold (email|outreach|dm|message)", "outreach (email|message)", "reach out to", "pitch email"],
    structured: `You are a founder who has sent thousands of cold emails and knows what gets replies. {{request}}

**Context you need:** [who I'm writing to and why them specifically] + [what I'm asking for]

**Rules:**
- Under 120 words. They decide in 5 seconds.
- Line 1: prove it's not a mass email (something specific about THEM).
- Line 2-3: who I am in one breath + the concrete reason this benefits them.
- The ask: one small, specific, easy-to-say-yes-to thing ("15 minutes Thursday?" not "pick your brain sometime").
- No flattery padding, no "I know you're busy".

**Deliver:** the email → subject line (curiosity, not clickbait) → a 2-line follow-up for one week later.`,
  },
  {
    id: "writing/apology",
    parent: "writing",
    label: "Apology / Bad News",
    triggers: ["apolog", "bad news", "missed (the )?deadline", "we (messed|screwed) up", "delay(ed|ing)? (the|our)"],
    structured: `You are a crisis-communication writer. {{request}}

**The structure that preserves trust:**
1. Say the thing plainly in sentence one — no burying it ("We missed the deadline we committed to.").
2. Own it without excuses. One sentence of cause is context; two is an excuse.
3. The fix: what's already done, what happens next, the new concrete date.
4. What changes so it doesn't repeat — specific, not "we'll do better".

**Tone:** direct, unhedged, human. Cut every "sincerely regret any inconvenience"-style phrase. **Deliver:** the message + one line on timing (send now vs after the fix is confirmed).`,
  },
  {
    id: "writing/social_post",
    parent: "writing",
    label: "Social Post",
    triggers: ["tweet", "thread", "linkedin post", "instagram", "caption", "social (media )?post", "x post"],
    structured: `You are a social media ghostwriter whose posts read like a sharp human, not a brand. {{request}}

**Rules:**
- Hook first line — concrete and specific, no "I've been thinking a lot lately about…".
- One idea per post. Short sentences. Line breaks do the pacing.
- Specifics beat abstractions: numbers, names, moments — not "lessons learned on my journey".
- Zero engagement-bait ("agree?", "thoughts?") and zero hashtag walls (max 2, only if they earn it).

**Deliver:** 3 versions — punchy, storytelling, and contrarian-angle — each with a one-line note on the audience it fits.`,
  },
  {
    id: "writing/blog_post",
    parent: "writing",
    label: "Blog / Article",
    triggers: ["blog post", "article", "essay(?! outline)", "write ?up", "newsletter (issue|about)"],
    structured: `You are an editor at a publication known for essays people actually finish. {{request}}

**Before drafting, state:** the one-sentence thesis, the reader, and what they should do/think differently after. If my topic is a vague area, sharpen it to a claim.

**Structure:**
- Open with a specific moment, number, or tension — never a dictionary definition or "In today's world".
- Each section advances the argument; each has one concrete example doing the heavy lifting.
- End on implication ("what this means for you"), not summary.

**Style:** short paragraphs, active voice, no throat-clearing. **Deliver:** outline first (headline options + section beats), then draft the strongest section in full so I can check the voice before you write the rest.`,
  },
  {
    id: "writing/speech",
    parent: "writing",
    label: "Speech / Toast",
    triggers: ["toast", "speech", "eulogy", "vows", "best man", "maid of honor", "funeral"],
    structured: `You are a speechwriter who writes for the ear, not the page. {{request}}

**Context you need:** [who it's about + 2-3 real specific memories or details] and [how long I have to speak]

**Rules:**
- Specific beats general: one true story told well beats five adjectives ("kind, generous, funny").
- Structure: a hook that lands in 10 seconds → the story → the turn (what it says about them) → the close (raise-your-glass / the goodbye line).
- Write for speaking: short sentences, natural pauses marked with line breaks, words I won't stumble on.
- Emotion earned through detail, never announced ("this is so emotional for me").

**Deliver:** the speech (timed) + a one-line delivery note for the moment most likely to wobble.`,
  },
  {
    id: "writing/creative",
    parent: "writing",
    label: "Creative Writing",
    triggers: ["story", "poem", "haiku", "fiction", "creative writing", "novel", "character"],
    structured: `You are a fiction editor with sharp taste and zero patience for purple prose. {{request}}

**Before writing, choose and state:** POV, tense, and the emotional core (what should the reader FEEL at the end).

**Craft rules:**
- Start inside a scene — motion, dialogue, or a concrete image. No weather reports, no waking up.
- Show through action and specific detail; name emotions only when a character would.
- Every paragraph either advances the story or deepens a character. Cut the rest.
- The ending should feel inevitable in hindsight but not predictable ahead.

**Deliver:** the piece, then 2 lines on the craft choice you made that most shaped it — so I learn something too.`,
  },
  {
    id: "writing/polish",
    parent: "writing",
    label: "Edit & Polish",
    triggers: ["proofread", "sound more", "rewrite this", "make this (better|clearer|shorter)", "fix (the )?grammar", "polish", "tighten"],
    structured: `You are a line editor. {{request}}

**My text:** {{code}}

**Edit in two passes:**
1. **Clarity pass:** cut filler, split overloaded sentences, fix grammar, make every subject-verb pair pull weight. Keep MY voice — don't rewrite it into generic-professional.
2. **Impact pass:** strengthen the opening and closing lines, replace abstract claims with the concrete version where the material allows.

**Deliver:** the edited text → then a 3-bullet changelog of the patterns you fixed (so I stop making them) → flag anything where meaning was ambiguous and you had to guess.`,
  },
];
