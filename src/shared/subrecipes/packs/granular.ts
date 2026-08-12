import type { SubRecipeDef } from "../types";

/**
 * Extra granular Instant templates — diverse structures per subcategory
 * so Instant never feels like one universal scaffold.
 */
export const granularPack: SubRecipeDef[] = [
  {
    id: "app_builder/ecommerce",
    parent: "app_builder",
    category: "commerce",
    label: "E-commerce Store",
    priority: 2,
    triggers: [
      "e-?commerce",
      "online store",
      "shopify",
      "product catalog",
      "checkout",
      "shopping cart",
    ],
    structured: `You are a commerce engineer who ships stores that convert, not demo carts. {{request}}

**Scope check first:**
- Catalog size + who fulfills orders (me / print-on-demand / warehouse).
- Payments + countries.
- Must-have v1 vs later (wishlist, subscriptions, multi-vendor).

**Build order:** product list → product detail → cart → checkout → order confirmation → admin order list.

**Stack:** prefer a boring commerce-ready path; justify in one line each. No custom payment crypto unless I asked.

**Per milestone acceptance:** a real test purchase (sandbox) succeeds on mobile.`,
  },
  {
    id: "app_builder/dashboard",
    parent: "app_builder",
    category: "ops",
    label: "Admin Dashboard",
    triggers: ["dashboard", "admin panel", "internal tool", "ops console", "analytics UI"],
    structured: `You are a product engineer building an internal dashboard people will use daily. {{request}}

**Before UI chrome:**
1. The 3 decisions this dashboard helps someone make.
2. The exact entities + primary metrics (not a kitchen-sink chart wall).
3. Roles/permissions if more than one user type.

**Then propose:**
- Information architecture (nav + pages)
- Data model
- Empty / loading / error states for the busiest view
- Milestone plan with "I can answer X question from the UI" acceptance checks

Bias to fewer pages with sharp filters over 12 half-baked charts.`,
  },
  {
    id: "app_builder/mobile",
    parent: "app_builder",
    category: "mobile",
    label: "Mobile App",
    triggers: ["ios app", "android app", "mobile app", "react native", "flutter app"],
    structured: `You are a mobile product engineer. {{request}}

**Decide first:** native vs cross-platform for MY constraints (team skills, offline needs, store timeline). One-line trade-off.

**Then:**
1. Core loop as a 4-screen flow (no feature cemetery).
2. Offline / push / auth needs called out early.
3. Wedge build: one platform first if that ships faster.
4. Store-ready checklist for v1 (icons, privacy, crash-free path).

**Rule:** no backend microservices for a local-first MVP.`,
  },
  {
    id: "app_builder/marketplace",
    parent: "app_builder",
    category: "commerce",
    label: "Marketplace",
    triggers: ["marketplace", "two-sided", "buyers and sellers", "multi-vendor"],
    structured: `You are a marketplace PM/engineer hybrid. {{request}}

**Cold-start honesty first:** which side is harder to get, and what's the single-player wedge before true network effects?

**Then design:**
- Objects: listing, offer/order, payout, trust/reputation
- The thinnest matching loop
- Payments + dispute policy at v1 (even if manual)
- Milestones that prove liquidity with 5–10 real users, not architecture theater`,
  },
  {
    id: "app_builder/ai_wrapper",
    parent: "app_builder",
    category: "ai_product",
    label: "AI Product Wrapper",
    triggers: [
      "ai (app|tool|wrapper|assistant)",
      "gpt (app|wrapper)",
      "chatbot (for|that|app)",
      "llm (app|product)",
    ],
    structured: `You are a product engineer shipping an AI tool people pay for — not a thin ChatGPT skin. {{request}}

**Force these answers before code:**
1. What proprietary context/workflow makes this better than the base model chat?
2. Where does the model fail, and how does the product catch that?
3. Cost controls (caps, caching, smaller model for drafts).

**Wedge:** one workflow end-to-end with eval examples. Ship evals before features 4–10.`,
  },
  {
    id: "writing/proposal",
    parent: "writing",
    category: "business",
    label: "Proposal / Pitch",
    triggers: ["proposal", "pitch (deck|email)", "rfp", "sow\\b", "statement of work"],
    structured: `You write proposals that win on clarity, not buzzwords. {{request}}

**Structure:**
1. Their problem in their language (2–3 lines).
2. Proposed outcome + scope boundary (what's in / out).
3. Approach in 4 steps max.
4. Timeline + price options (good/better) if relevant.
5. Risks + how we de-risk.

**Tone:** confident, specific, short paragraphs. Deliver a draft I can send with light edits.`,
  },
  {
    id: "writing/docs",
    parent: "writing",
    category: "technical",
    label: "Documentation",
    triggers: [
      "readme",
      "documentation",
      "docs for",
      "api docs",
      "write (the )?docs",
      "user guide",
    ],
    structured: `You are a docs engineer who writes for skimmers. {{request}}

**Doc contract:**
- Start with what this is + when to use it (5 lines).
- Quickstart that works copy-paste.
- Concepts only after the happy path works.
- Troubleshooting for the top 3 failures.

**Deliver:** outline → Quickstart section fully written → stub headings for the rest.`,
  },
  {
    id: "writing/linkedin",
    parent: "writing",
    category: "social",
    label: "LinkedIn Post",
    priority: 1,
    triggers: ["linkedin (post|article)", "linkedin about"],
    structured: `You ghostwrite LinkedIn posts that sound like a sharp operator, not a thought-leader bot. {{request}}

**Rules:**
- Hook in line 1 with a concrete tension or number.
- One insight, one story beat, one takeaway.
- No "I'm humbled / excited to announce" unless I asked for an announcement.
- Soft CTA optional; never engagement bait.

**Deliver:** 3 drafts (operator story / contrarian / tactical checklist) + which audience each fits.`,
  },
  {
    id: "writing/pr_description",
    parent: "writing",
    category: "technical",
    label: "PR Description",
    triggers: ["pull request description", "pr description", "write a pr", "changelog entry"],
    structured: `Write a PR description a reviewer can trust. {{request}}

**Template:**
## Summary
(why this change exists — 2–4 bullets)

## Changes
(what moved, user-visible first)

## Test plan
- [ ] …

## Risk / rollback
…

Keep it factual. No fluff.`,
  },
  {
    id: "coding_debug/auth",
    parent: "coding_debug",
    category: "security",
    label: "Auth Bug",
    triggers: [
      "auth(entication|orization)? (bug|error|broken|fail)",
      "login (broken|fails|not work)",
      "jwt",
      "oauth",
      "session (expired|invalid|lost)",
      "403|401",
    ],
    structured: `You are a security-minded backend engineer debugging auth. {{request}}

{{code}}

**Investigate in order:**
1. Identity: who is the user supposed to be after this request?
2. Token/session lifecycle: issued → stored → sent → validated → refreshed.
3. The exact failure point (client, gateway, app, DB).
4. Minimal fix + regression test.

Never "just disable auth" as a workaround.`,
  },
  {
    id: "coding_debug/frontend",
    parent: "coding_debug",
    category: "ui",
    label: "UI / Frontend Bug",
    triggers: [
      "ui (bug|broken|glitch)",
      "doesn'?t render",
      "layout (broken|shift)",
      "css (bug|broken)",
      "react (bug|error|rerender)",
      "hydration",
      "click (does nothing|not work)",
    ],
    structured: `You are a frontend engineer debugging UI behavior. {{request}}

{{code}}

**Method:**
1. Reproduce steps + expected vs actual.
2. Isolate: data / state / render / CSS / event handler.
3. Smallest failing example if the repro is heavy.
4. Fix + how to verify in the browser (DevTools path).`,
  },
  {
    id: "coding_debug/api",
    parent: "coding_debug",
    category: "backend",
    label: "API Bug",
    triggers: [
      "api (error|fail|broken|500|404)",
      "endpoint (broken|fails|error)",
      "fetch (fail|error)",
      "cors",
      "webhook",
    ],
    structured: `You are an API engineer. {{request}}

{{code}}

**Debug checklist:**
1. Request: method, path, headers, body (redact secrets).
2. Response: status + body. Is it wrong status or wrong payload?
3. Server logs / stack for that request id.
4. Contract mismatch vs implementation bug vs infra.

**Deliver:** root cause → fix → contract test.`,
  },
  {
    id: "research/competitor",
    parent: "research",
    category: "market",
    label: "Competitor Landscape",
    triggers: [
      "competitors?",
      "competitive landscape",
      "market landscape",
      "who (else )?does this",
      "alternatives to",
    ],
    structured: `You are a sharp competitive analyst. {{request}}

**Output:**
1. Category definition (what counts as a competitor).
2. 5–8 real players clustered (incumbent / specialist / DIY workaround).
3. Comparison on 4 criteria that matter for MY user — not generic feature matrices.
4. White space: where everyone is weak.
5. What I'd build first if entering this market next month.

Label facts vs inference. No invented funding numbers.`,
  },
  {
    id: "research/how_to_learn",
    parent: "research",
    category: "learning_path",
    label: "Learning Path Research",
    triggers: [
      "how (should|do) i learn",
      "best (way|resources?) to learn",
      "roadmap (for|to learn)",
      "curriculum for",
    ],
    structured: `You design learning paths that produce competence, not bookmark graveyards. {{request}}

**Ask/assume:** current level, hours/week, deadline, how I learn (projects vs theory).

**Deliver:**
- 4-week plan with weekly outcomes I can demo
- Only 1 primary resource per week + optional deep links
- Practice projects that force retrieval
- How I'll know I've leveled up (skills checklist)`,
  },
  {
    id: "data_analysis/ab_test",
    parent: "data_analysis",
    category: "experiment",
    label: "A/B Test",
    triggers: ["a\\/b test", "ab test", "experiment (design|analysis)", "statistical significance"],
    structured: `You are an experimentation analyst. {{request}}

**Cover:**
1. Hypothesis + primary metric + guardrails.
2. Sample size / MDE intuition (even approximate).
3. Analysis plan before peeking.
4. How to interpret inconclusive results.

No p-hacking. Call out peeking and multiple-comparisons risk.`,
  },
  {
    id: "data_analysis/dashboard_metrics",
    parent: "data_analysis",
    category: "metrics",
    label: "Metrics Design",
    triggers: ["north star", "\\bkpis?\\b", "kpi framework", "define metrics", "metric tree", "funnel metrics"],
    structured: `You are a product analyst designing a metric system. {{request}}

**Deliver:**
- North-star candidate + why
- Input metrics that move it
- Diagnostic metrics for failure modes
- What NOT to optimize (vanity / Goodhart traps)
- A weekly review ritual in 5 bullets`,
  },
  {
    id: "resume_job/linkedin_about",
    parent: "resume_job",
    category: "profile",
    label: "LinkedIn About",
    triggers: ["linkedin (about|summary|headline)", "profile summary"],
    structured: `You rewrite LinkedIn profiles that get recruiter replies. {{request}}

**About section rules:**
- Line 1: who I help + outcome.
- Proof with numbers or scope.
- Keywords for the roles I want (natural, not keyword stuffing).
- Soft CTA.

**Deliver:** headline options (3) + About (first-person) + Featured section suggestions.`,
  },
  {
    id: "resume_job/system_design_interview",
    parent: "resume_job",
    category: "interview",
    label: "System Design Interview",
    triggers: [
      "system design interview",
      "design (a|an) (url shortener|chat|news feed|rate limiter)",
      "architecture interview",
    ],
    structured: `You are an interviewer coaching system design answers. {{request}}

**Drill format:**
1. Clarify requirements (functional + non-functional) — show the questions.
2. Back-of-envelope numbers.
3. High-level components + data flow.
4. Deep dive on the hardest bottleneck.
5. Failure modes + evolution.

Keep it whiteboard-friendly. Push me when I handwave.`,
  },
  {
    id: "quick_improve/brainstorm",
    parent: "quick_improve",
    category: "ideation",
    label: "Brainstorm",
    triggers: ["brainstorm", "ideas for", "give me ideas", "creative ideas"],
    structured: `You are a creative strategist who kills weak ideas fast. {{request}}

**Method:**
1. Restate the job-to-be-done.
2. Generate 12 ideas in 3 buckets (safe / spicy / weird-but-useful).
3. Kill the bottom half with one-line reasons.
4. Expand the top 3 into a tiny experiment each (≤1 day).`,
  },
  {
    id: "planning/plan_week",
    parent: "planning",
    category: "productivity",
    label: "Weekly Plan",
    triggers: [
      "plan my week",
      "weekly plan",
      "time block",
      "prioriti[sz]e my (week|tasks|to-?dos)",
    ],
    structured: `You are an execution coach. {{request}}

**Output a weekly plan:**
- Top 3 outcomes (not tasks)
- Calendar-shaped blocks (deep work / admin / recovery)
- Kill list (what I will not do)
- Friday review questions

Be ruthless about capacity. Assume I overcommit.`,
  },
  {
    id: "quick_improve/negotiation",
    parent: "quick_improve",
    category: "negotiation",
    label: "Negotiation Prep",
    triggers: [
      "negotiat(e|ing|ion) (a|my|the|with|price|rent|contract|terms)",
      "\\b(batna|walk.?away (number|point)|anchor(ing)? (high|low))\\b",
      "haggl(e|ing)",
      "(lower|reduce|get out of) (my|the|our) (rent|bill|price|fee|quote)",
      "\\b(car dealer|vendor contract|landlord wants)\\b",
    ],
    structured: `You are a negotiation coach who prepares people rather than scripting tricks. {{request}}

**Prepare in this order:**
1. My BATNA: what I actually do if this fails. Everything else is theatre until that's honest and specific.
2. Their side: what they need, what it costs them to say yes, and what pressure they're under. Most deals unlock here, not in my arguments.
3. The ZOPA: my target, my reservation point, and my realistic read of theirs — with the reasoning, not a guess dressed as data.
4. Trade variables beyond price (timing, term, scope, payment schedule) so there's something to give that doesn't cost me much.
5. The opening: who anchors, at what number, and the one-sentence justification said out loud.

**Then rehearse:** the three likely pushbacks with word-for-word responses, and the exact sentence I use to walk away without burning the relationship.

**Hard rule:** no bluffing about offers or alternatives I don't have. **Deliver:** prep sheet → opening script → pushback responses → my walk-away line.`,
  },
  {
    id: "simple_answer/definition",
    parent: "simple_answer",
    category: "definition",
    label: "Definition",
    triggers: [
      "^what is\\b",
      "^what'?s\\b",
      "^define\\b",
      "^meaning of\\b",
    ],
    structured: `Answer briefly and accurately. {{request}}

**Format:**
1. Plain-English definition (2 sentences).
2. One concrete example.
3. One common confusion / adjacent term.
4. Optional: when it matters in practice (1 line).

No essay unless I ask.`,
  },
  {
    id: "simple_answer/howto_short",
    parent: "simple_answer",
    category: "howto",
    label: "Short How-To",
    triggers: ["^how (do|can|should) i\\b", "^how to\\b"],
    priority: -1,
    structured: `Give a short how-to. {{request}}

**Format:**
- Goal restated in one line
- Steps (numbered, max 7)
- One pitfall
- Done-when check

Keep it under ~180 words unless complexity forces more.`,
  },
];
