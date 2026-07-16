# Launch plan

## Order of operations

1. **Repo public** — LICENSE, README (with demo GIF), CONTRIBUTING, PRIVACY are in place.
2. **Chrome Web Store** — submit `askwise-0.2.0.zip` with `docs/store-listing.md` + `store-assets/`.
   Review typically takes a few days; broad host permissions may trigger extra review — the
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
from a deterministic rubric, and a diff of what was added. Advanced can use a built-in
on-device model (downloads once into the browser) or your own Ollama / API key.

The part I care most about: nothing leaves your device unless you opt in. No server, no
account, no telemetry. It's MIT-licensed — templates are pure data, so adding a template
pack is a 10-minute PR.

Quality machinery: a 290+ prompt fixture suite gates classification accuracy in CI, and an
eval harness scores every rewrite.

Repo: [link] · Store: [link]

## Anticipated HN questions (prep answers)

- "Why not just teach people to prompt?" → The score + diff view IS the teaching; the
  rewrite is the worked example.
- "Templates feel canned?" → Tier 1 is deterministic on purpose (instant, offline,
  auditable); Tier 2 personalizes with your on-device / local model. Also: PRs welcome.
- "MV3 extension reading my prompts = scary" → composer only, never chat history; the
  content script is ~40 lines per site adapter, easy to audit.
- "What about keyword-free phrasing?" → stretch fixtures track hard cases; rules cover the
  gated set. On-device embeddings are deferred (can't load CDN ONNX under host-page CSP).

## Repo hygiene checklist

- [x] Demo GIF at top of README (`docs/assets/demo.gif` via `npm run capture:assets`)
- [x] Issue templates (bug / template-pack / fixture batch) + `GOOD_FIRST_ISSUES.md`
- [x] Store listing + privacy copy updated for on-device WebLLM / `offscreen`
- [x] Smoke checklist in `docs/smoke-checklist.md`
- [x] Version `0.2.0` + `npm run zip` → `askwise-0.2.0.zip`
- [ ] Open the six good-first issues from `.github/GOOD_FIRST_ISSUES.md` on GitHub
- [ ] Tag `v0.2.0` release and attach `askwise-0.2.0.zip`
- [ ] Manual host smoke on live ChatGPT/Claude/Gemini/etc. (see smoke checklist)
