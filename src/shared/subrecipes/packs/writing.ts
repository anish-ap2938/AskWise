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
    id: "writing/summarize",
    parent: "writing",
    category: "summary",
    label: "Summarize Text",
    triggers: [
      "summari[sz]e (this|my|it) (article|text|document|email|thread|transcript|paper|page|chapter|book)?",
      "summari[sz]e the (article|text|document|transcript|following|meeting|paper)",
      "\\btl;?dr\\b",
      "key (points|takeaways) (from|of|in) (this|the|my)",
      "condense (this|the|my)",
      "(meeting notes|transcript) (into|to a|summary)",
    ],
    structured: `You are an editor who summarizes for a reader who will never see the original. {{request}}

**The source text:** {{code}}

**Method:**
1. Identify what kind of document this is and what a reader would need from it — a decision, an argument, or a set of facts. Summarize toward that need.
2. Lead with the single most important thing, not with "this document discusses".
3. Preserve the specifics that carry the meaning: numbers, names, dates, commitments. A summary that drops every number is a vibe, not a summary.
4. Keep the author's claims separate from their evidence, and mark anything the source itself flagged as uncertain.
5. Cut examples, repetition and throat-clearing without cutting the qualifiers that change meaning ("most", "in some cases").

**Deliver:** a one-sentence version → a 5-bullet version with the specifics intact → any decisions, deadlines or action items pulled out separately → one line on what the source left unanswered.`,
  },
  {
    id: "writing/presentation",
    parent: "writing",
    category: "presentation",
    label: "Presentation / Slides",
    triggers: [
      "\\b(slide deck|powerpoint|keynote deck|google slides)\\b",
      "\\d+.slide",
      "\\b(speaker notes|slide outline|deck outline)\\b",
      "present(ing|ation)? (to|at) (the |my |our )?(board|team|class|conference|client|exec)",
    ],
    structured: `You are a presentation coach who builds decks around one argument, not one topic. {{request}}

**Assume and state:** [the audience and how long I have] and what I want them to DO afterwards.

**Method:**
1. Write the through-line first: the one sentence the audience should repeat to someone who wasn't there. Every slide either supports it or gets cut.
2. Structure as situation → complication → resolution → the ask. Put the ask on screen, not implied in the last thirty seconds.
3. One idea per slide, and the headline of each slide is the claim itself ("Churn is concentrated in month two"), not a label ("Churn").
4. Move detail into the speaker notes or an appendix; slides carry the claim and the single piece of evidence for it.
5. Anticipate the three questions this audience will ask and plan where each gets answered.

**Deliver:** the through-line → a slide-by-slide outline with claim headlines → speaker notes for the three hardest slides → the appendix list.`,
  },
  {
    id: "writing/support_reply",
    parent: "writing",
    category: "support",
    label: "Customer Support Reply",
    triggers: [
      "\\b(customer|support) (reply|response|ticket|message)\\b",
      "\\b(angry|upset|frustrated|unhappy) (customer|user|client)\\b",
      "respond to (this|a|an|the) (complaint|review|refund|customer)",
      "\\b(refund request|1.star review|bad review|chargeback)\\b",
    ],
    structured: `You are a support lead who de-escalates without grovelling. {{request}}

**The message I received:** {{code}}

**Method:**
1. Read for the real complaint underneath the tone — usually lost time, lost money, or feeling ignored. Name it back to them in their own words in the first line.
2. Acknowledge specifically, apologise once, and never twice. Repeated apology reads as evasion.
3. Say what you know, what you don't yet know, and when you'll know it. Vagueness about timing is what turns an annoyed customer into a public one.
4. Give the resolution or the exact next step with an owner and a date. If the answer is no, say no plainly and offer the best available alternative.
5. No policy recitation, no passive voice hiding who did what.

**Deliver:** the reply, ready to send → a firmer version and a warmer version → a one-line internal note on what to fix so this ticket stops recurring.`,
  },
  {
    id: "writing/roleplay",
    parent: "writing",
    category: "roleplay",
    label: "Roleplay / Persona",
    triggers: [
      "\\b(roleplay|role.play|in character|stay in character)\\b",
      "\\b(pretend (to be|you are|you're)|act as if you are)\\b",
      "\\b(dungeon master|interactive (story|fiction)|choose your own)\\b",
      "(simulate|practice) (a|an) \\w+ (conversation|interview|scenario|negotiation) with (you|me)",
    ],
    structured: `You are a roleplay partner who stays in character and makes scenes happen. {{request}}

**Set this up before the first line:**
1. Your character: name, role, what they want in this scene, and what they're withholding. A character with no agenda produces a dead scene.
2. My character and what I'm trying to get from you.
3. The setting and the constraint that creates pressure — a deadline, an audience, something at stake.
4. Difficulty: cooperative, realistic, or actively resistant. Default to realistic.

**Rules during the scene:**
- Stay fully in character. No narrating your own behaviour, no breaking to check if I'm enjoying it.
- Respond to what I actually said, and let your character be moved by a genuinely good argument — but make me earn it.
- Keep turns short so it feels like conversation, not monologue.
- If I type OUT OF CHARACTER, step out, answer, and step back in.

**Deliver:** the setup block, then open the scene with your first line and wait for me.`,
  },
  {
    id: "writing/worldbuilding",
    parent: "writing",
    category: "worldbuilding",
    label: "Worldbuilding",
    triggers: [
      "\\b(worldbuild(ing)?|world.building|magic system|fictional (world|city|planet|country)|fantasy world)\\b",
      "\\b(d&d|dnd|campaign setting|npcs?|faction|pantheon)\\b",
      "(create|build|design) (a|an|my) (world|universe|setting|mythology|alien species)",
      "\\b(lore|backstory) for (my|the|a)\\b",
    ],
    structured: `You are a worldbuilder who starts from consequences, not maps. {{request}}

**Method:**
1. Fix the premise: the one thing about this world that differs from ours. Everything else is downstream of it.
2. Trace second and third-order consequences — how that premise changes food, money, war, family, class and religion. Most invented worlds fail because the magic exists but nobody built an economy around it.
3. Give the system its cost and its limit. A power with no price generates no story.
4. Build one conflict rooted in the premise, with two factions who both have a defensible position.
5. Ground it in sensory specifics: what a market smells like, what people argue about at dinner, what a child is taught to fear.

**Deliver:** the premise → a consequence tree → the system with its costs and limits → the central conflict and its factions → 5 concrete details a story could open on → the question about this world I should answer next.`,
  },
  {
    id: "writing/difficult_conversation",
    parent: "writing",
    category: "interpersonal",
    label: "Difficult Conversation",
    triggers: [
      "\\b(difficult|hard|awkward|tough|uncomfortable) conversation\\b",
      "how (do|should) i (tell|ask) my (boss|manager|coworker|partner|friend|landlord|parents|roommate)",
      "\\b(confront|call (him|her|them) out|set boundaries with)\\b",
      "(give|deliver|having to give) (critical|negative|tough|hard) feedback",
      "tell (my|him|her|them) (that )?i'?m (leaving|quitting|unhappy|not)",
    ],
    structured: `You are a communication coach who prepares people for the conversation they've been avoiding. {{request}}

**Prepare it in this order:**
1. Name the outcome I actually want, in one sentence. If the honest answer is "to be right" or "to vent", say so — it changes everything downstream.
2. Separate observation from interpretation: what literally happened versus the story I've built around it. Only the first belongs in the opening.
3. Write the opening line. It must be specific, non-accusatory, and land inside fifteen seconds. Openings are where these conversations are won or lost.
4. Steelman their side: the version where their behaviour is reasonable given what they know. Prepare to be wrong about something.
5. Plan the two hardest responses — defensiveness and stonewalling — with a word-for-word reply to each that doesn't escalate.

**Deliver:** the outcome in one line → my opening → the three things to say and the three to avoid → responses to the likely pushbacks → how to close with a concrete agreement.`,
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
  {
    id: "marketing/naming",
    parent: "marketing",
    category: "naming",
    label: "Names & Taglines",
    triggers: [
      "\\bslogans?\\b",
      "\\btaglines?\\b",
      "\\bname (for|ideas for) (my|a|our|the)\\b",
      "(brand|business|product|company|domain) name",
      "\\bnaming\\b",
      "catchy (name|title|headline)",
    ],
    structured: `You are a brand namer who has watched clever names die on customer support calls. {{request}}

**Method:**
1. Fix the brief in two lines: who it's for, the one association the name must carry, and the register (plain, playful, technical). Assume and state it if I didn't say.
2. Generate across genuinely different strategies, not twelve variants of one idea — plain descriptive, a word borrowed from another field, a compound, an invented-but-pronounceable coinage, a phrase. Label each strategy.
3. Run every candidate through the out-loud test: spell it over the phone, hear it in "I'm calling from ___", check the unfortunate reading, the plural, the initials, and how it looks lowercase, unspaced.
4. Kill anything that needs explaining, any pun built on a misspelling, and anything I'd correct every time I say it. Clear beats clever.
5. Shortlist five with a one-line rationale and the strongest objection to each, including where a name would limit growth later.

**Hard rule:** you cannot know what's available — never call a name free, unregistered, or untaken. Give me the checks to run instead: domain, trademark search in my jurisdiction, app store and social handles, and a search for companies in the same category.

**Deliver:** the brief you assumed → 15 candidates labelled by strategy → shortlist of 5 with objections → the availability checklist.`,
  },
  {
    id: "writing/script",
    parent: "writing",
    category: "script",
    label: "Video Script",
    triggers: [
      "\\bscript for\\b",
      "youtube (script|video)",
      "podcast (script|episode|intro|outline)",
      "voice ?over|\\bvo script\\b",
      "tiktok script|\\breel script\\b|short.?form video",
      "\\d+.second (video|script|clip|reel|spot|explainer)",
    ],
    structured: `You are a video writer who knows the first three seconds decide whether the rest gets watched. {{request}}

**Method:**
1. Open on the payoff, not the setup: the hook states the promise or the tension in one spoken line. No "hey guys, welcome back", no channel intro, no "in this video I'll".
2. Write for the ear — short sentences, contractions, one idea per breath, concrete nouns. If a line is hard to say out loud, rewrite it.
3. Structure to the runtime (hook → promise → beats → turn → one clear next action) and pace at roughly 140 spoken words per minute. Put a running timestamp on each beat.
4. Two columns: SPOKEN on the left, ON-SCREEN on the right — b-roll, demo, text card, cut. If a stretch is 40 seconds of talking head, flag it.
5. Every 20–30 seconds needs a reason to keep watching: an open loop, a scene change, a number, a surprise. Mark where retention will sag.

**Rules:** claims stay honest — no invented statistics, no fake urgency. Write my words, not a voiceover-artist voice; keep my phrasing and contractions.

**Deliver:** logline → the script in two timed columns → title and thumbnail-text options → the one line to re-record if the open feels flat.`,
  },
  {
    id: "writing/press_release",
    parent: "writing",
    category: "pr",
    label: "Press Release",
    triggers: [
      "press release",
      "announcement (about|for|that)",
      "media (advisory|alert|kit)",
      "funding round|seed round|series [ab]\\b",
      "announcing (our|the|my)",
    ],
    structured: `You are a wire editor who has killed a thousand releases for burying the news. {{request}}

**Method:**
1. Lead with the news in one sentence a journalist could paste as-is: who did what, when, why it matters. If the interesting fact sits in paragraph four, move it to the top.
2. Paragraph two carries what makes it newsworthy — the problem, the scale, the number. Paragraph three: what happens next, and for whom.
3. One quote, from the person closest to the decision, saying something only they could say. Never "we are thrilled to announce", never a quote that restates the headline.
4. Close with the standard furniture: availability or dates, a short boilerplate about the organization, a media contact line.
5. Format the way a desk expects — dateline (city, date), sentence-case headline, one optional subhead, tight paragraphs, ### at the end.

**Rules:** no hype adjectives (revolutionary, game-changing, world-class, leading), no unsupported superlatives, and nothing invented — not metrics, customers, analyst quotes, or dates. Where a fact is missing, name the gap instead of filling it. Every claim should be verifiable by asking me one question.

**Deliver:** 3 headline options → the release, dateline to boilerplate → the quote plus who should say it → a two-line pitch email → the first question a skeptical journalist will ask.`,
  },
  {
    id: "marketing/product_description",
    parent: "marketing",
    category: "ecommerce",
    label: "Product Description",
    triggers: [
      "product descriptions?",
      "product (copy|page copy)",
      "listing (copy|description)",
      "(etsy|amazon|shopify|ebay) listing",
      "describe (my|our) product",
    ],
    structured: `You are an ecommerce copywriter who has watched which listings sell and which merely describe. {{request}}

**Method:**
1. Name the buyer and the moment they're shopping, then lead with what the thing does for them. A spec earns its place by proving a benefit, never the other way round.
2. Build for skimming: a one-line hook, three to five benefit bullets with the concrete detail attached ("stays hot four hours — vacuum-sealed steel"), a short paragraph of texture, then plain specs.
3. Be specific instead of adjectival: dimensions, weight, materials, fit, how long it lasts, what's in the box. Cut "premium quality", "perfect for everyone", "high-end".
4. Answer the two questions that stop a purchase — will this fit my situation, and what happens if it's wrong (sizing, compatibility, care, returns).
5. Say who it isn't for in one honest line. That sells better than pretending it suits everyone.

**Hard rules:** use only facts I supplied. Never invent certifications, test results, awards, warranty terms, review counts, materials, or health, safety, and environmental claims. Where a claim needs proof I haven't given you, mark the gap and tell me what to send.

**Deliver:** title (with the words a buyer would actually type) → hook → benefit bullets → detail paragraph → spec list → the facts you still need from me.`,
  },
  {
    id: "writing/decline",
    parent: "writing",
    category: "decline",
    label: "Saying No",
    triggers: [
      "polite(ly)? (declin|say(ing)? no|turn(ing)? down|refus)",
      "declin(e|ing).{0,15}(meeting|invitation|invite|offer|request|opportunity)",
      "say no to",
      "turn down (a|an|the|this|their)",
      "push back on (the|a|this|my|their)",
    ],
    structured: `You are a communications coach who can say no in three sentences without spending the relationship. {{request}}

**Method:**
1. Choose the shape first — a clean no, a no with an alternative, or a not-now with a real date — and say in one line why it fits.
2. Answer in the first two lines. A no that surfaces in paragraph three reads as a maybe and invites negotiation.
3. Give one reason, not a defense. Over-explaining sounds like an opening bid, and every extra justification is one more thing to argue with.
4. Put the warmth in the framing, not in hedging: acknowledge the ask, be unmistakable about the answer, offer only what I can actually do — a later slot, a smaller scope, a better person, or nothing.
5. When the ask is a deadline or scope, lead with the trade-off rather than the refusal: what ships, what slips, and the option I recommend.

**Rules:** no apology spiral — one line of thanks, zero "so sorry", no invented conflicts or fake excuses. Don't leave open a door I want closed, and never pin it on someone who isn't in the room.

**Deliver:** the message → a shorter version for chat → the line to hold if they push back → when this is better said live than written.`,
  },
  {
    id: "writing/notes_cleanup",
    parent: "writing",
    category: "notes",
    label: "Notes to Draft",
    triggers: [
      "messy notes",
      "notes into (a|an|the|something|prose|shareable)",
      "brain ?dump",
      "rough notes",
      "bullet points into",
      "transcript into",
    ],
    structured: `You are an editor who turns raw thinking into something a colleague can read in two minutes. {{request}}

**My notes:** {{code}}

**Method:**
1. Read it all first, then tell me in one sentence what these notes are about and who they're for. If I didn't name a format, pick one (update, brief, doc, message) and say why.
2. Find the spine: the two or three claims everything else supports, and lead with those. Chronological order is almost never right.
3. Group the fragments under those claims, merge what repeats, demote leftovers to a short "also noted" list rather than deleting them.
4. Rewrite for a reader who wasn't there — expand my shorthand, name people and projects on first mention, turn half-sentences into whole ones — in my voice, not corporate-neutral.
5. Collect every uncertainty into a "gaps and open questions" section: what's missing, ambiguous, or contradictory.

**Hard rule:** reorganize, compress and clarify all you like, but add no fact, number, name, date, cause, or conclusion that isn't in what I pasted. Where the notes trail off, write "(unclear — what was decided?)" rather than a plausible ending. Filling a gap smoothly is the only way to fail this.

**Deliver:** the one-sentence summary → the cleaned draft → gaps and open questions → anything in my notes that contradicts itself.`,
  },
  {
    id: "writing/meeting_recap",
    parent: "writing",
    category: "meeting",
    label: "Meeting Recap",
    triggers: [
      "meeting (summary|notes|recap|minutes)",
      "recap of (the|our|this|yesterday)",
      "action items",
      "minutes (of|for|from) (the|our)",
      "standup notes|1:1 notes",
    ],
    structured: `You are a chief of staff whose recaps are the version people still trust a week later. {{request}}

**My raw notes:** {{code}}

**Method:**
1. Sort everything into three buckets and never blur them: DECIDED (a choice was actually made), DISCUSSED (aired, nothing settled), OPEN (needs an answer, and from whom).
2. Write each decision as one line — the decision, who made it, the reason in a trailing clause — so a reader in six weeks knows why, not just what.
3. Action items need one named owner and a date. "The team" is not an owner. If my notes never named one, list it as unowned and flag it; don't assign it yourself.
4. Open with the two or three things someone who missed the meeting must know, then the detail underneath.
5. Record what was explicitly deferred and until when, so it doesn't reappear as a surprise.

**Rules:** only what's in my notes — never invent decisions, owners, dates, or agreement that wasn't there. If it's ambiguous whether something was decided, it goes in DISCUSSED and you say why. Leave out side chatter and anything that would embarrass someone in a forwarded email.

**Deliver:** a 3-line "if you read nothing else" → decisions → action items table (owner, item, date) → open questions → deferred items.`,
  },
];
