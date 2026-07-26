# ⚡ AskWise

**Grammarly for AI prompts.** A free, open-source Chrome extension that turns rough prompts
into structured, model-ready prompts — on ChatGPT, Claude, Gemini, Perplexity, DeepSeek,
and Copilot. Everything runs on your device.

![AskWise demo](docs/assets/demo.gif)

Type `"i want to build and app for fitness"` → get a spec-style prompt with a role, scope
questions, milestones, and acceptance criteria — plus a before/after quality score that
teaches you *why* it's better.

Regenerate store screenshots + this GIF: `npm run capture:assets`

## Why it's different

- **Local-first, actually.** Classification, templates, and scoring are plain local code.
  Every Advanced rewrite and Refine request uses the built-in on-device model (WebLLM /
  WebGPU, ~1–2 GB, downloaded once). No server, API key, account, or telemetry. See
  [PRIVACY.md](PRIVACY.md).
- **An intent classifier, not a text expander.** A rule engine (100% on gated fixtures)
  routes your prompt to one of 9 modes and 36+ specialized sub-recipes (ATS resume checks,
  salary negotiation, slow-query debugging, cold outreach, …).
- **Explainable scoring.** The 0–100 score is a deterministic rubric (task clarity,
  specificity, context, format, constraints…) — not LLM vibes. The diff view shows exactly
  what was added.
- **Quality is tested.** `npm run eval` runs every fixture through
  classify → rewrite → score and gates on accuracy; add `--judge` to have a local LLM grade
  rewrite quality 1–10.

## Install

**From source (2 minutes):**

```bash
git clone <this repo> && cd AskWise
npm install
npm run build
```

Then: `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select `dist/`.
Visit chatgpt.com, type a prompt (8+ characters), click the **⚡ Improve** pill.

**Chrome Web Store:** coming soon.

## On-device AI for Advanced rewrites

The instant (Tier 1) rewrites work offline forever. For LLM-powered Advanced rewrites,
AskWise downloads Qwen2.5 3B (~1.9 GB by default) into the browser and runs it locally via
WebGPU (Chrome 113+). The model corrects spelling and grammar, preserves the user's intent,
and applies mode-specific prompt-engineering rules. No prompt is sent to an external AI API.

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

## Keyboard shortcut

`Alt+I` — open the improver for the focused composer.

## License

[MIT](LICENSE)
