import type { SubRecipeDef } from "../types";

/** Demand generation — copy and tactics that acquire or convert customers. */
export const marketingPack: SubRecipeDef[] = [
  {
    id: "marketing/seo",
    parent: "marketing",
    category: "seo",
    label: "SEO Content",
    triggers: [
      "\\bseo\\b",
      "keyword research",
      "\\b(serp|backlinks?|meta description|search intent|search volume)\\b",
      "rank(ing)? (for|on|higher in) (google|search)",
      "organic traffic",
    ],
    structured: `You are an SEO who ranks pages by matching intent, not by stuffing keywords. {{request}}

**Method:**
1. Classify the intent behind the target query (informational, commercial, transactional) and say what page format currently wins for it — matching that format is the entry ticket.
2. Build a keyword set around one primary term plus the questions and modifiers real searchers add, grouped by the single page that should own each. Never two pages competing for one term.
3. Outline the page so it answers the query in the first 100 words, then covers the subtopics every competitor includes plus one they all miss.
4. Specify on-page elements: title under 60 characters, meta description, H2 structure, and which internal links point in and out.

**Deliver:** intent read → keyword map → page outline with headings → title and meta → the single change most likely to move rankings first.`,
  },
  {
    id: "marketing/ad_copy",
    parent: "marketing",
    category: "ads",
    label: "Ad Copy",
    triggers: [
      "\\b(ad copy|google ads|facebook ads|meta ads|tiktok ads|ppc campaign)\\b",
      "(headline|copy|creative) for (my|an|the|our) (ad|ads|campaign)",
      "\\b(ctr|cost per click|roas|ad spend)\\b",
      "write (me )?(an|some|\\d+) ads?\\b",
    ],
    structured: `You are a direct-response copywriter who has spent real money on ads. {{request}}

**Assume and state:** [the platform and who the audience is] and what the click leads to.

**Write to this method:**
1. Start from one pain or desire the buyer already has words for — use their words, not the category's jargon.
2. Lead with the benefit, prove it with a specific (a number, a timeframe, a named outcome), then a CTA that says exactly what happens next.
3. Respect the format: character limits, whether the image or the first line does the hooking, and what the platform's policies forbid.
4. Vary the angle across variants — pain, proof, curiosity, offer — not just the wording.

**Deliver:** 5 headline and primary-text pairs across 4 distinct angles → which to test first and why → the one metric that decides the winner.`,
  },
  {
    id: "marketing/landing_page",
    parent: "marketing",
    category: "conversion",
    label: "Landing Page Copy",
    triggers: [
      "\\blanding page\\b",
      "landing page (copy|headline|conversion|that converts)",
      "\\bsubhead(line|er)?\\b",
      "\\b(hero section|above the fold|value proposition|cta button)\\b",
      "(sales|product|pricing) page copy",
      "conversion rate (optimi[sz]|is low|problem)",
    ],
    structured: `You are a conversion copywriter who treats a landing page as one continuous argument. {{request}}

**Assume and state:** [who lands here and where they came from] and the single action this page must produce.

**Structure the page:**
1. Hero: an outcome-focused headline, a subhead naming who it's for, and the primary CTA above the fold. No clever headline that needs a second read.
2. Objection order: list the 3-4 reasons this visitor doesn't convert, then sequence the sections to answer them one at a time.
3. Put proof next to the claim it supports, not in a testimonial graveyard at the bottom.
4. One CTA, identical wording every time it appears. Cut the nav links that leak traffic.

**Deliver:** section-by-section copy → 3 headline alternatives → the objection list you designed against → the first A/B test to run.`,
  },
  {
    id: "marketing/social_calendar",
    parent: "marketing",
    category: "social",
    label: "Content Calendar",
    triggers: [
      "content calendar",
      "posting schedule",
      "\\d+ (posts|videos|reels|tweets) (a|per) (week|month|day)",
      "social (media )?(strategy|calendar|plan)",
      "\\b(content pillars|repurpos(e|ing))\\b",
    ],
    structured: `You are a content strategist who builds calendars a one-person team can actually keep. {{request}}

**Assume and state:** [the platforms and how often I can post] and the business outcome behind the content.

**Build it this way:**
1. Three or four content pillars tied to what the audience wants, not to internal announcements — with the share of posts each gets.
2. A repeatable weekly slot pattern (Tuesday teardown, Thursday build-in-public, Sunday roundup) so I never face a blank calendar.
3. One flagship piece per week that gets cut down into the smaller posts — spell out the repurposing chain per platform.
4. A batching plan that matches real life: what gets made in one session, what must be same-day.

**Deliver:** a 4-week calendar with dates, hooks and formats → the pillar mix → the repurposing chain → what to drop first in a busy week.`,
  },
  {
    id: "marketing/email_campaign",
    parent: "marketing",
    category: "email",
    label: "Email Campaign",
    triggers: [
      "\\b(email (sequence|campaign|marketing|funnel)|drip campaign|welcome series|nurture sequence)\\b",
      "\\b(open rate|click.?through rate|unsubscribe rate|deliverability)\\b",
      "\\b(abandoned cart|re.?engagement) (email|sequence|flow)\\b",
      "(grow|monetize) (my|our) (newsletter|email list)",
    ],
    structured: `You are a lifecycle marketer who writes sequences people don't unsubscribe from. {{request}}

**Assume and state:** [who's on the list and how they joined] and the single action the sequence drives.

**Design the sequence:**
1. Map it to the reader's state, not your calendar — what they know and doubt at email 1 versus email 4.
2. One job per email. Specify the send trigger, the delay, subject line, preview text, and body.
3. Earn the ask: value first, the offer only once they have a reason to believe it. Say which email carries the pitch.
4. Subject lines that survive a phone inbox — under 45 characters, specific, no manufactured urgency.
5. Define the exit: what happens on click, and when they stop hearing from me.

**Deliver:** the sequence as a table → each email written in full → the metric per email → one variant of the highest-stakes subject line.`,
  },
  {
    id: "marketing/launch",
    parent: "marketing",
    category: "launch",
    label: "Launch Plan",
    triggers: [
      "\\b(product launch|launch (plan|strategy|week|day|checklist))\\b",
      "\\b(product hunt|waitlist|beta launch|pre.?launch)\\b",
      "(announce|announcing|launching) (my|our|the) (new )?(product|feature|app|course|book)",
    ],
    structured: `You are a launch lead who has shipped launches that landed and ones that didn't. {{request}}

**Assume and state:** [the launch date and channel] and what a successful launch concretely produces.

**Plan three phases:**
1. Pre-launch: the audience you warm up first, the asset that captures intent (waitlist, early access), and the people you tell personally before anything is public.
2. Launch day: an hour-by-hour run of what posts where, who amplifies, and who answers comments — launch day is won on responsiveness, not on the announcement.
3. Post-launch: the follow-up in the week after, when most of the real signups actually arrive.

**Also give me** the one positioning line every asset repeats, and what to fix first if day-one traffic converts badly.

**Deliver:** phase plan with dates → launch-day run of show → asset checklist → success metrics with numbers attached.`,
  },
  {
    id: "marketing/positioning",
    parent: "marketing",
    category: "brand",
    label: "Positioning & Messaging",
    triggers: [
      "\\b(positioning|brand (voice|positioning|messaging)|value prop(osition)?|tagline|slogan)\\b",
      "how (do|should) (i|we) (describe|position|explain) (my|our)",
      "\\b(elevator pitch|one.?liner)\\b",
      "differentiate (my|our) (product|brand|company|startup)",
    ],
    structured: `You are a positioning strategist working in the April Dunford tradition. {{request}}

**Work through it strictly in this order:**
1. Competitive alternatives: what the buyer would genuinely do if this didn't exist — including "nothing" and "a spreadsheet".
2. Unique attributes: what I have that those alternatives don't. Features and facts, not adjectives.
3. The value each attribute delivers, stated in the buyer's terms and outcomes.
4. Who cares disproportionately about that value — the segment where the value is obvious rather than argued.
5. The market frame I want to be judged inside, since that frame sets every comparison the buyer makes.

Then write the positioning as one sentence a customer would repeat to a colleague.

**Deliver:** the five-step analysis → a positioning statement → 3 taglines with the segment each targets → the claim I should stop making.`,
  },
];
