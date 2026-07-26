# AskWise Privacy

**Last updated:** July 17, 2026

**Hosted policy (Chrome Web Store URL):**
https://askwise-privacy.vercel.app/privacy-policy

The short version: prompt improvement runs on your device. AskWise has no backend and does not send prompts to an external AI provider.

## Chrome Web Store Limited Use Compliance

AskWise’s use of information complies with the Chrome Web Store User Data Policy, including the Limited Use requirements. AskWise uses user data only to provide or improve its disclosed prompt-improvement functionality and does not use or transfer user data for advertising, creditworthiness, or unrelated purposes.

The use of information received from Google APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements.

## What AskWise accesses

- Prompt text in the active chat composer on supported AI sites when you use Improve
- Optional local file attachments you choose (parsed on-device)
- Settings and saved templates in `chrome.storage.local`

AskWise does not intentionally request or separately collect health, financial, or precise location information. However, prompt text or files selected by a user may contain such information. AskWise processes that content only to provide the features described in this policy.

## What leaves your device

1. **Default / Simple / Structured improve:** fully on-device.
2. **Advanced / Refine:** the bundled WebLLM model performs inference on-device.
3. **On-device model data:** model weights / tokenizer / config may download once from Hugging Face / MLC CDNs. The JavaScript and WebAssembly runtime used for inference is packaged in the extension. Prompts are not sent to those CDNs.

Before on-device inference, AskWise attempts to redact common sensitive-data patterns (API tokens, emails, payment-card numbers). Automated redaction may not identify every sensitive value, so review generated prompts before using them.

## Websites vs recipients

AskWise injects UI on supported chat sites and reads the active composer. It does not independently transmit prompt text to those websites. A site receives the prompt only when you submit it there normally.

Hugging Face / MLC receive model-download requests only, not prompts. AskWise does not send prompt content to an AskWise server or an external AI provider.

## Storage

Settings, templates, and model progress stay in `chrome.storage.local` until cleared or the extension is uninstalled. There is no AskWise server retention.

Full HTML copy: [`public/privacy-policy.html`](public/privacy-policy.html) and the hosted URL above.
