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
- Built-in on-device AI (~1 GB) that downloads once into your browser and runs via WebGPU
  for Advanced rewrites — no Ollama required
- Optional larger local models via Ollama / LM Studio
- Optional bring-your-own-key for Anthropic/OpenAI
- Attach local files (.txt, .md, .pdf) as context — parsed on-device
- Secret redaction (API keys, emails, tokens) before any AI call

**Privacy first:**
- No backend, no analytics, no telemetry, no account
- Only reads the composer input — never chat history
- Model weights download from Hugging Face / MLC once; inference stays on your device
- API keys stored locally, never synced
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

## Data Safety (Chrome Web Store form)
| Question | Answer |
|----------|--------|
| Collects data? | No — processing is local. Optional Tier 2 uses on-device model, localhost Ollama, or user BYOK |
| Data sold? | No |
| Data used for tracking? | No |
| Data linked to user? | No account system |
| Encryption in transit | HTTPS for model weight download (once) and optional cloud BYOK |
| Data deletion | Uninstall extension or clear templates in options |

## Permissions justification
- `storage`: save settings, templates, optional API keys, and on-device model progress locally
- `offscreen`: run the WebGPU on-device language model in a hidden document (not visible to the page)
- Site hosts (chatgpt.com, claude.ai, gemini.google.com, perplexity.ai, chat.deepseek.com,
  copilot.microsoft.com): inject the improve widget on the composer only
- Hugging Face / GitHub raw CDNs: download on-device model weights once into browser cache
- `localhost`: optional Ollama / LM Studio local model
- `api.anthropic.com` / `api.openai.com`: optional BYOK, only when user configures keys
