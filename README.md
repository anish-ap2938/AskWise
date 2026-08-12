# AskWise

A free Chrome extension that rewrites the rough prompt sitting in your chat box into a
clear, structured one — on ChatGPT, Claude, Gemini, Perplexity, DeepSeek and Copilot.
It runs entirely on your device: no account, no server, no telemetry.

![AskWise demo](docs/assets/demo.gif)

Type `i want to build and app for fitness`, click **Improve**, and you get a spec-style
prompt with a role, scope questions, milestones and acceptance criteria — next to a
before/after score that names what was missing, so the next prompt you write yourself is
better.

## What makes it different

- **Local, not "local-ish".** Classification, templates and scoring are plain code that
  runs in the page. Advanced rewrites and Refine use a small model running in your own
  browser through WebGPU (weights download once, ~1 GB). Nothing is sent to an AI API.
  See [PRIVACY.md](PRIVACY.md).
- **It recognises the request, it doesn't expand text.** A rule engine plus a small
  intent classifier routes your prompt to one of 18 modes and 200+ specialised sub-recipes
  — ATS resume screening, salary negotiation, slow-query debugging, cold outreach, study
  plans.
- **The score is explainable.** 0–100 from a deterministic rubric (task clarity,
  specificity, context, format, constraints…), not model vibes. The Changes view shows
  exactly which words AskWise added.
- **Rewrite quality is tested.** `npm run eval` runs every fixture through
  classify → rewrite → score and gates on accuracy; add `--judge` to have a local model
  grade rewrite quality 1–10.

## Install

The Chrome Web Store listing isn't live yet. From source takes about two minutes:

```bash
git clone <this repo> && cd AskWise
npm install
npm run build
```

Then open `chrome://extensions`, turn on **Developer mode**, choose **Load unpacked** and
select `dist/`. Go to chatgpt.com, type at least 8 characters into the chat box, and the
**Improve** pill appears next to it. `Alt+I` opens it without the mouse.

Regenerate the store screenshots and the GIF above with `npm run capture:assets`.

## On-device model (Advanced + Refine)

Simple and Structured rewrites are instant and work offline from the moment you install.
Advanced and Refine need a model: AskWise downloads a fine-tuned Qwen2.5 1.5B build
(~1 GB, or pick a different size in settings) into the browser cache and runs it through
WebGPU on Chrome 113+. It fixes spelling and grammar, keeps your intent, and applies the
prompt-engineering rules for the detected mode. Text that looks like an API key, token or
email address is redacted before the model sees it.

## Development

```bash
npm run dev       # Vite dev server (fixture pages at /tests/fixtures/)
npm test          # Unit tests (Vitest) — includes the 290+ fixture classifier gate
npm run eval      # Quality report: classification accuracy + rewrite score lift
npm run test:e2e       # E2E / smoke tests (Playwright)
npm run capture:assets # Store screenshots (1280×800) + docs/assets/demo.gif
npm run build          # Production build → dist/
npm run zip            # Build + askwise-<version>.zip for Web Store upload
```

Pre-ship checklist: [docs/smoke-checklist.md](docs/smoke-checklist.md) · Store copy: [docs/store-listing.md](docs/store-listing.md)

### Architecture in 30 seconds

```
content script (per site adapter)
  └─ widget (Shadow DOM React app)
       ├─ classify (regex rules)  ──────────── instant, local
       ├─ sub-recipes + recipes (templates) ── instant, local
       ├─ score (deterministic rubric) ─────── instant, local
       └─ messages ─→ service worker
                        └─ Advanced / Refine: on-device WebLLM only
```

Key directories: `src/shared/` (classify, score, recipes, sub-recipe packs — all pure and
unit-tested), `src/content/` (adapters + widget), `src/background/` (router, LLM providers),
`tests/fixtures/prompts.json` (the classifier exam).

## Contributing

The highest-leverage contribution is **a template pack** — ~10 minutes, no build knowledge
needed. See [CONTRIBUTING.md](CONTRIBUTING.md). Fixture contributions (real prompts people
type) are a close second.

## License

[MIT](LICENSE)
