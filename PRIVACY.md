# AskWise Privacy

**The short version: nothing leaves your device unless you explicitly configure it to.**

## What AskWise does with your text

- Your prompt is read from the chat composer **only while the widget is active** and is
  processed **entirely on your device**: classification, scoring, and the instant (Tier 1)
  rewrites are plain local code — no network involved.
- Files you attach via "Attach context" are read with the browser's file APIs, parsed
  locally (PDFs via a bundled pdf.js), and **never uploaded anywhere**.

## When network requests happen

1. **Local AI rewrites (default):** requests go to `localhost` (Ollama / LM Studio) —
   your machine, not the internet.
2. **Cloud rewrites (opt-in only):** if you paste your own Anthropic or OpenAI API key in
   settings, "Advanced" rewrites call that provider directly with your key. Secrets
   (API keys, emails, card numbers, tokens) are **redacted locally before** the request.

## What we collect

Nothing. No analytics, no telemetry, no accounts, no crash reporting, no "anonymous
usage statistics". The extension has no server.

## Storage

Settings, saved templates, and API keys are stored in `chrome.storage.local` on your
machine. Uninstalling the extension deletes them.

## Permissions explained

- `storage` — save your settings locally.
- Host permissions for chatgpt.com, claude.ai, gemini.google.com, perplexity.ai,
  chat.deepseek.com, copilot.microsoft.com — inject the widget on those sites.
- `localhost` — talk to your local Ollama/LM Studio.
- api.anthropic.com / api.openai.com — only used if you add your own key.

Verify all of this yourself — the code is open source under the MIT license.
