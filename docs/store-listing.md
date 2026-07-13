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
- Optional local AI via Ollama (your prompts never leave your machine)
- Optional bring-your-own-key for Anthropic/OpenAI
- Attach local files (.txt, .md, .pdf) as context — parsed on-device
- Secret redaction (API keys, emails, tokens) before any AI call

**Privacy first:**
- No backend, no analytics, no telemetry, no account
- Only reads the composer input — never chat history
- API keys stored locally, never synced
- Open source (MIT) — verify everything yourself

## Category
Productivity

## Screenshots to capture (1280×800)
1. Hero: rough prompt + popover open showing 21 → 78 score and the rewrite (chatgpt.com)
2. Diff view: green highlights showing what was added
3. Sub-recipe: "resume pass ATS" prompt showing the ATS Optimization chip
4. Placeholder fill: clicking [paste job posting] with the inline input open
5. Options page: local model connected, privacy explainer visible
6. Onboarding page: before/after demo

## Data Safety (Chrome Web Store form)
| Question | Answer |
|----------|--------|
| Collects data? | No — all processing is local unless user opts into Tier 2 |
| Data sold? | No |
| Data used for tracking? | No |
| Data linked to user? | No account system |
| Encryption in transit | N/A (local-first); HTTPS for optional cloud BYOK |
| Data deletion | Uninstall extension or clear templates in options |

## Permissions justification
- `storage`: save settings, templates, and optional API keys locally
- Site hosts (chatgpt.com, claude.ai, gemini.google.com, perplexity.ai, chat.deepseek.com,
  copilot.microsoft.com): inject the improve widget on the composer only
- `localhost`: optional Ollama / LM Studio local model
- `api.anthropic.com` / `api.openai.com`: optional BYOK, only when user configures keys
