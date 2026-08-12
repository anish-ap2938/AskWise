# AskWise — Chrome Web Store listing

## Title

AskWise — Better AI Prompts, On Your Device

## Short description (132 char max)

Rewrites the rough prompt in your chat box into a clear, structured one. Runs on your device. Free, no account.

## Detailed description

Most people type half a sentence into ChatGPT, get a vague answer, and assume that's
as good as it gets. Usually the prompt was the problem — no role, no specifics, no
format, no definition of done.

AskWise sits next to the chat box on ChatGPT, Claude, Gemini, Perplexity, DeepSeek and
Copilot. Write your prompt the way you normally would, click Improve, and read the
rewritten version before you send it. Nothing happens automatically and nothing is sent
anywhere.

**What you get when you open it**

- A score out of 100 for your prompt and for the rewrite, with the specific gaps named:
  no output format, no audience, no constraints. The rubric is ordinary code, so the
  same prompt always scores the same.
- Three versions to pick from — Simple (one tightened sentence), Structured (sections,
  constraints, acceptance criteria) and Advanced (rewritten by a language model running
  on your own machine).
- A Changes view that highlights every word AskWise added, so you can learn the pattern
  instead of only pasting it.
- Blanks like `[paste the job posting]` that you click and fill in place.
- Refine: a short back-and-forth to adjust the prompt, including asking it to quiz you
  before it rewrites.
- Attach a local file (text, Markdown, PDF, CSV, JSON and similar) and its contents get
  woven into the prompt. The file is read in your browser and never uploaded.

**It works out what you're actually asking for**

AskWise recognises 18 kinds of request — debugging, app specs, resumes, research,
writing, data analysis, study plans, image prompts and more — then picks from over 200
specialised templates: ATS resume screening, salary negotiation, slow-query debugging,
cold outreach, study plans. When it guesses wrong, change it from the dropdown and the
rewrite updates.

**Private because there is nowhere to send anything**

- No account, no sign-in, no server. AskWise has no backend.
- Simple and Structured rewrites are plain local code and work offline.
- Advanced and Refine run a small language model inside your browser with WebGPU. The
  weights download once from Hugging Face (about 1 GB) and then that works offline too.
  Your prompt is never sent to an AI API.
- AskWise reads only the text in the chat box — not your conversation history, not the
  rest of the page.
- Things that look like API keys, tokens and email addresses are redacted before the
  local model reads your prompt.
- No analytics, no telemetry, nothing sold. The source is MIT-licensed if you would
  rather check than trust.

Free, and it stays free — no paid tier, no trial, no upsell. It was built for students
and everyone else who can't expense another subscription.

Advanced and Refine need Chrome 113 or newer with WebGPU. Everything else works without
it.

## Category

Productivity

## Screenshots (store-assets/, 1280×800)

Generated via `npm run capture:assets` from local fixtures (swap for live-site shots if
you prefer):

1. `01-hero.png` — rough prompt + popover with before/after score and rewrite
2. `02-diff.png` — Changes view showing what was added
3. `03-ats.png` — resume/ATS sub-recipe chip
4. `04-placeholder.png` — structured rewrite with fillable blanks
5. `05-options.png` — settings: on-device model + privacy
6. `06-onboarding.png` — first-run before/after demo

## Privacy policy URL (Chrome Web Store)

https://askwise-privacy.vercel.app/privacy-policy

Also valid: https://askwise-privacy.vercel.app/privacy

Do **not** use the bare domain root alone if reviewers treat it as an "owner site".
Source: `site/privacy-policy/` — redeploy with `cd site && vercel --prod`.
Must stay public (no Vercel SSO): `vercel project protection disable askwise-privacy --sso`

## Single purpose description

AskWise improves the prompt text a user has typed into a supported AI chat composer,
using local templates and a language model that runs on the user's own device.

## Data Safety (Chrome Web Store form)

Declare that AskWise handles user data (do **not** select "no user data").

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
| Data deletion | Uninstall the extension, or clear settings and saved prompts in options |

## Permissions justification

- `storage`: save settings, saved prompts and on-device model progress locally
- `offscreen`: run the WebGPU on-device language model in a hidden document
- Site hosts (chatgpt.com, claude.ai, gemini.google.com, perplexity.ai, chat.deepseek.com,
  copilot.microsoft.com): inject the improve widget and read the active composer
- Hugging Face / MLC CDNs: download non-executable model weights and config once into the
  browser cache. The JS/WASM inference runtime is packaged in the extension.
