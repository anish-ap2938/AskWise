# Launch plan

## Order of operations

1. **Repo public** — LICENSE, README (with demo GIF!), CONTRIBUTING, PRIVACY are in place.
   Record the demo GIF before anything else; it does 80% of the selling.
2. **Chrome Web Store** — submit with the listing in `store-listing.md` + 6 screenshots.
   Review typically takes a few days; broad host permissions may trigger extra review, the
   justifications in the listing answer them.
3. **Show HN** — after the store listing is live (link both store + repo).
4. **Product Hunt** — a week after HN, reusing the assets and any testimonials.

## Show HN draft

**Title:** Show HN: AskWise – open-source "Grammarly for AI prompts", fully local

**Text:**

I kept watching friends type "write me a resume" into ChatGPT and get mush back. The gap
between a rough prompt and a good one is mechanical — role, specifics, constraints, output
format — so I built a Chrome extension that closes it automatically.

How it works: a rule-based intent classifier routes your prompt to one of 9 modes and ~36
specialized templates — ATS resume checks, slow-query debugging, salary negotiation, cold
outreach. You get three variants (Simple / Structured / Advanced), a before/after score
from a deterministic rubric, and a diff of what was added. Optionally, a local LLM via
Ollama rewrites for even better results.

The part I care most about: nothing leaves your device. No server, no account, no
telemetry. The instant rewrites are plain local code; the AI tier talks to your own
Ollama or your own API key (with local secret redaction first). It's MIT-licensed —
templates are pure data, so adding a template pack is a 10-minute PR.

Quality machinery, since "prompt improver" is easy to do badly: a 290+ prompt fixture
suite gates classification accuracy in CI, and an eval harness scores every rewrite and
can use a local LLM as a judge.

Repo: [link] · Store: [link]

## Anticipated HN questions (prep answers)

- "Why not just teach people to prompt?" → The score + diff view IS the teaching; the
  rewrite is the worked example.
- "Templates feel canned?" → Tier 1 is deterministic on purpose (instant, offline,
  auditable); Tier 2 personalizes with your local model. Also: PRs welcome, it's data.
- "MV3 extension reading my prompts = scary" → composer only, never chat history; the
  content script is ~40 lines per site adapter, easy to audit.
- "What about keyword-free phrasing?" → stretch fixtures track hard cases; rules cover the
  gated set. On-device embeddings are deferred (can't load CDN ONNX under host-page CSP).

## Repo hygiene checklist

- [ ] Demo GIF at top of README
- [ ] `good-first-issue` labels on: 3 sub-recipe requests, 2 adapter requests, fixture drive
- [ ] Issue templates (bug / template-pack proposal / fixture batch)
- [ ] Tag v0.2.0 release with the store zip attached
