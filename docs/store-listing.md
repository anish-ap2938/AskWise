# AskWise — Chrome Web Store Listing (draft)

## Title
AskWise — AI Prompt Improver

## Short description
Turn rough prompts into structured, model-ready prompts on ChatGPT, Claude, Gemini,
Perplexity, DeepSeek & Copilot — locally and privately.

## Detailed description
AskWise is Grammarly for AI prompts. It detects what you're trying to do (debug code,
build an app, fix a resume, research, write, analyze data…) and rewrites your prompt into
the structure that gets the best answer — without your text ever leaving your browser.

**Key features:**
- Floating ⚡ Improve button on ChatGPT, Claude, Gemini, Perplexity, DeepSeek, and Copilot
- Intent detection: 9 modes + 36 specialized templates (ATS resume checks, salary
  negotiation, slow-query debugging, cold outreach, study plans, and more)
- Before/after prompt score with an explainable rubric — learn WHY the rewrite is better
- Diff view: see exactly what was added to your prompt
- Tappable placeholders: click [paste job posting] and fill it in inline
- Simple / Structured / Advanced variants for every prompt
- Instant offline rewrites — no API key, no account, works forever
- Built-in on-device AI (~1–2 GB) that downloads once and generates every Advanced rewrite
  and Refine update privately via WebGPU
- Automatic spelling, grammar, and prompt-structure improvement in Advanced
- Attach local files (.txt, .md, .pdf) as context — parsed on-device
- Secret redaction (API keys, emails, tokens) before any AI call

**Privacy first:**
- No backend, no analytics, no telemetry, no account
- Only reads the composer input — never chat history
- Model weights download from Hugging Face / MLC once; inference stays on your device
- No cloud AI API keys and no external prompt-processing service
- Open source (MIT) — verify everything yourself

## Category
Productivity

## Screenshots (store-assets/, 1280×800)
Generated via `npm run capture:assets` from local fixtures (swap for live-site shots if you prefer):

1. `01-hero.png` — rough prompt + popover with before/after score and rewrite
2. `02-diff.png` — Diff tab showing what was added
3. `03-ats.png` — resume/ATS sub-recipe chip
4. `04-placeholder.png` — structured rewrite with bracket placeholders
5. `05-options.png` — options: on-device model + privacy
6. `06-onboarding.png` — onboarding before/after demo

## Privacy policy URL (Chrome Web Store)
https://askwise-privacy.vercel.app/privacy-policy

Also valid: https://askwise-privacy.vercel.app/privacy

Do **not** use the bare domain root alone if reviewers treat it as an “owner site”.
Source: `site/privacy-policy/` — redeploy with `cd site && vercel --prod`.
Must stay public (no Vercel SSO): `vercel project protection disable askwise-privacy --sso`

## Single purpose description
AskWise improves user-selected prompt text in supported AI chat composers using local
templates and a built-in on-device AI model.

## Data Safety (Chrome Web Store form)
Declare that AskWise handles user data (do **not** select “no user data”).

Check at least:
- **Website content** — composer prompt text and optional attached files
- **Personal communications** and/or **Personally identifiable information** if the form
  presents those categories for prompt text that may contain chat content or identifiers

| Question | Answer |
|----------|--------|
| Data sold? | No |
| Data used for tracking? | No |
| Data linked to user? | No AskWise account; prompt inference stays on-device |
| Encryption in transit | HTTPS for non-executable model data downloads |
| Data deletion | Uninstall extension or clear settings/templates in options |

## Permissions justification
- `storage`: save settings, templates, and on-device model progress locally
- `offscreen`: run the WebGPU on-device language model in a hidden document
- Site hosts (chatgpt.com, claude.ai, gemini.google.com, perplexity.ai, chat.deepseek.com,
  copilot.microsoft.com): inject the improve widget and read the active composer
- Hugging Face / MLC CDNs: download non-executable model weights/config once into browser cache
  (JS/WASM inference runtime is packaged in the extension)
