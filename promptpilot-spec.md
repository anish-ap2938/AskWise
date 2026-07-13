**Product brand is now AskWise.** This file keeps the historical PromptPilot working name from the original spec.

# PromptPilot — Product & Engineering Specification (v1.0)

**Working name:** PromptPilot (alternatives: PromptCraft, PromptIQ)
**One-liner:** Grammarly for AI prompts — a Chrome extension that classifies what you're typing into ChatGPT/Claude and rewrites it into a high-quality, model-aware prompt before you send it.
**Document purpose:** This is the build spec. Hand this to Cursor (or Claude Code) and implement top-to-bottom. MVP scope is Sections 1–16. Section 17+ is v2.

---

## A. Executive summary

Most AI chat prompts are underspecified: no context, no output format, no constraints. LLMs demonstrably perform better with structured prompts, but users don't know which structure fits which task. PromptPilot injects a small floating widget next to the prompt box on ChatGPT and Claude. When clicked, it classifies the user's intent (question / debug / app build / research / writing / resume / data analysis / agent task), applies the matching prompt recipe, and offers three rewrites — Simple, Structured, Advanced — plus a before/after prompt score. The user replaces, copies, or saves the result. Nothing leaves the browser until the user explicitly requests an AI-powered rewrite, and even then secrets are redacted locally first.

**The three architectural decisions that define v1:**

| Decision | Choice | Why |
|---|---|---|
| Backend | **None in v1.** Fully client-side. LLM calls go from the extension service worker to (a) a **local model via Ollama/LM Studio — the default, first-class path**, or (b) Anthropic/OpenAI with the user's own key (BYOK, optional). | Zero infra cost, zero server-side data liability, and with the local path even the LLM rewrite never leaves the machine — "your prompts never leave your computer" becomes literally true end-to-end. |
| Improvement engine | **Two tiers.** Tier 1: deterministic local template engine (instant, free, offline). Tier 2: LLM rewrite via provider ladder **local → cloud BYOK → none** (opt-in per click). | Kills the cost risk entirely: the recommended local model is free, ~2.5 GB, and good enough for prompt rewriting. |
| Scoring | **Deterministic local rubric**, not LLM-graded. | Instant, free, explainable ("Missing: output format, constraints"), and consistent. |

---

## B. Problem statement

Users type prompts like "build me a job tracker app," "why is my code not working," "make this resume bullet better." These produce mediocre outputs not because the models are weak but because the prompts omit the task framing, context, constraints, and output format the models are tuned to use. Existing tools (AIPRM, Promptly, PromptPerfect) are either template libraries or one-button "make it longer" enhancers. Neither classifies intent nor right-sizes structure: a simple question should get a *concise* better prompt; an app build should get a full engineering brief.

**The core insight to build around:** the product is an intent classifier + recipe selector, not a text expander.

---

## C. Target users and personas

| Persona | Behavior | Killer mode | Willingness to pay |
|---|---|---|---|
| **Dev using Cursor/Claude Code** | Types "build a CRM," gets a shallow scaffold, iterates painfully | App Builder, Coding Debug, Agent Mode | High (already pays for Cursor) |
| **Job seeker** | Rewrites resume bullets and cover letters daily in ChatGPT | Resume Mode, Writing Mode | Medium |
| **Knowledge worker / analyst** | Asks research and data questions, gets unsourced walls of text | Research Mode, Data Analysis Mode | Medium-high (expensable) |
| **Casual ChatGPT user** | Asks quick questions, doesn't know prompting exists as a skill | Quick Improve, Simple Answer | Low → free tier, conversion funnel |

Primary launch persona: **the Cursor/Claude developer.** They feel prompt-quality pain most acutely, they hang out where you can market cheaply (X, r/cursor, r/ClaudeAI), and App Builder Mode is a genuine differentiator no competitor has.

## D. Competitive landscape and differentiation

| Competitor | What it is | Weakness we exploit |
|---|---|---|
| AIPRM | Huge library of static prompt templates | No awareness of what you actually typed; template browsing is friction |
| Promptly / Pretty Prompt | One-click "enhance" | Uniform expansion; no modes, no intent classification, prompt bloat |
| PromptPerfect | Web-app prompt optimizer | Not inline; you must leave your chat |
| Native "improve prompt" features (ChatGPT canvas hints, etc.) | Platform-specific | Single-platform; no cross-model optimization; no privacy story |

**Differentiation (in priority order):**
1. **Intent classification → right-sized structure** (Simple Answer Mode is a feature, not a failure)
2. **App Builder Mode** — deep engineering-brief generation for Cursor/Claude users
3. **Verifiably local-first privacy** — no backend in v1, BYOK, local redaction
4. **Model-specific output** — XML-tagged prompts for Claude, task/context/format for ChatGPT

---

## E. MVP product requirements

### In scope (v1)

- **PR-1** Chrome MV3 extension, works on `chatgpt.com` and `claude.ai`
- **PR-2** Floating "Improve" button anchored near the prompt input, appears when input has ≥ 8 characters
- **PR-3** Popover UI with: detected mode (editable), prompt score with missing-elements list, three rewrite variants (Simple / Structured / Advanced), actions (Replace / Copy / Save as template)
- **PR-4** Local rule-based classifier covering 8 intent labels (see §I)
- **PR-5** Tier 1 local template rewrites for all modes; Tier 2 LLM rewrite via the provider ladder: **local model (Ollama/LM Studio) → cloud BYOK → Tier 1 fallback**. Local is the default and is auto-detected.
- **PR-6** Provider settings page: local endpoint config (auto-detect Ollama at `localhost:11434`, custom base-URL field for LM Studio/llama.cpp/vLLM, model picker populated from `/api/tags`) plus optional Anthropic/OpenAI keys stored in `chrome.storage.local`, never synced
- **PR-7** Local secret redaction before any LLM call, with a visible warning chip when secrets are detected
- **PR-8** Local template library (save/load/delete), stored in `chrome.storage.local`
- **PR-9** Options page: default mode, default variant, target-model preference, enable/disable per site
- **PR-10** Never auto-replace user text. Never read anything outside the prompt input element. No analytics/telemetry in v1.

### Explicitly out of scope (v1)

Accounts, backend, sync, team features, Gemini/Perplexity/Cursor-web support, side panel, prompt history, marketplace, payments.

---

## F. UX flows

### Primary flow
1. User types in the ChatGPT/Claude composer.
2. After 8+ chars and a 600 ms debounce, a small pill button ("⚡ Improve · 42") appears bottom-right of the input, showing the live local score.
3. Click → popover (Shadow DOM, ~380 px wide) opens above the button:
   - Header: detected mode chip (e.g. "App Build") — tappable to switch mode
   - Score row: `42 → 91` with expandable "what's missing" list
   - Tabs: **Simple | Structured | Advanced**, each showing the rewritten prompt in a scrollable preview
   - If no Tier 2 provider available: Simple/Structured come from Tier 1 templates instantly; Advanced tab shows a two-option CTA — "Use a free local model (recommended, 2-min setup)" linking to the Ollama onboarding screen, or "Connect an API key". If Ollama is detected running but unreachable from the extension (CORS 403), show the one-line `OLLAMA_ORIGINS` fix instead (§J).
   - Local Tier 2 rewrites **stream token-by-token into the preview pane** so the 10–20 s generation time on small models feels responsive rather than stuck.
   - Footer actions: **Replace** (primary), Copy, Save as template
4. Replace writes the chosen variant into the composer (dispatching proper input events so the site's React state updates) and closes the popover. The original text is kept in an in-memory undo buffer; a toast offers "Undo" for 10 s.

### Secondary flows
- **Secrets detected:** red chip "2 secrets will be redacted" appears in the popover; expanding shows masked matches (`sk-ant-•••`); redaction happens automatically before any LLM call; user can toggle "keep original in local rewrite."
- **Site DOM changed / adapter failed:** fall back to generic `textarea`/`contenteditable` detection; if that fails too, the extension does nothing (fail silent, log to console with `[PromptPilot]` prefix).
- **Keyboard shortcut:** `Alt+I` opens the popover for the focused input (registered via `commands` in manifest).

### UX rules
- Never steal focus while the user is typing.
- Popover closes on Escape, outside click, or Replace.
- Widget must be visually quiet: single pill, no animation loops, respects dark/light via `prefers-color-scheme`.

---

## G. Modes specification

Every mode is a **recipe**: a classification label, a slot schema, a Tier 1 template, and Tier 2 LLM instructions. Recipes live in `src/shared/recipes/*.ts` as typed objects — not JSON — so templates can use functions.

```ts
// src/shared/types.ts
export type ModeId =
  | "quick_improve" | "simple_answer" | "research" | "app_builder"
  | "coding_debug" | "resume_job" | "writing" | "data_analysis"
  | "agent_task" | "custom";

export interface Recipe {
  id: ModeId;
  label: string;
  description: string;
  /** Ordered slots the rewrite should try to fill */
  slots: SlotId[];
  /** Deterministic local rewrite. Returns 3 variants. */
  localRewrite(raw: string, ctx: RewriteContext): VariantSet;
  /** System prompt for the Tier 2 LLM rewrite */
  llmSystemPrompt(targetModel: TargetModel): string;
}

export type SlotId =
  | "role" | "task" | "context" | "audience" | "constraints"
  | "output_format" | "examples" | "success_criteria" | "self_check"
  | "recency" | "citations" | "tech_stack" | "architecture"
  | "schema" | "testing" | "acceptance_criteria" | "tone" | "length";

export interface VariantSet {
  simple: string;
  structured: string;
  advanced: string; // Tier 1 gives its best; Tier 2 overwrites this
}
```

### Mode summary table

| Mode | Trigger examples | Slots emphasized | Anti-bloat rule |
|---|---|---|---|
| Quick Improve | default for short generic asks | task, context, output_format | ≤ 3 sentences added |
| Simple Answer | definitional questions ("what is X") | task, audience, length | Advanced variant capped at ~60 words |
| Deep Research | "research/compare/market/landscape" | task, recency, citations, output_format, success_criteria | — |
| App Builder | "build/create/make + app/tool/dashboard/CRM/site" | task, tech_stack, architecture, schema, testing, acceptance_criteria | — |
| Coding Debug | "bug/error/not working/fix" + code presence | task, context, constraints ("minimal changes"), output_format | Must include "preserve my approach" |
| Resume / Job | "resume/CV/cover letter/bullet/interview" | task, audience (ATS + recruiter), constraints (truthful), output_format (3 versions) | — |
| Writing | "email/post/essay/caption/LinkedIn" | audience, tone, length, task, constraints | — |
| Data Analysis | "SQL/pandas/Excel/chart/analyze/dataset" | context (schema), task, output_format (code vs. narrative), success_criteria | — |
| Agent Task | imperative verbs + tool context ("fix this repo", "refactor", "implement") | task ("implement, don't suggest"), constraints, acceptance_criteria, self_check | — |
| Custom | user-defined | user-defined | — |

### Full worked example — App Builder Mode

**Input:** `build me a job tracker app`

**Simple (Tier 1, local):**
> Build a job application tracker web app. Include: add/edit/delete job entries, status stages (applied → interview → offer → rejected), search and filtering, and a simple dashboard. Propose the tech stack and file structure first, then implement step by step.

**Structured (Tier 1, local):**
> You are a senior full-stack engineer. Build a job tracker web application.
>
> **Core features:** auth, CRUD job entries, status pipeline, notes per application, search/filter, dashboard with counts per stage.
> **Stack:** Next.js + TypeScript + Tailwind + Prisma + PostgreSQL (propose alternatives only if strongly justified).
> **Process:** 1) propose architecture, DB schema, routes, and component tree; 2) wait for my confirmation; 3) implement incrementally with runnable code at each step.
> **Include:** setup commands, folder structure, error handling, and basic tests.

**Advanced (Tier 2, LLM — Claude-targeted, XML-tagged):**
> ```
> <role>Senior full-stack product engineer</role>
> <task>Design and implement a job-application tracker web app end to end.</task>
> <requirements>
>   <features>auth (email+password), CRUD applications, status pipeline, per-app notes and contacts, reminders, search/filter/sort, dashboard analytics (apps per stage, response rate, time-in-stage)</features>
>   <stack>Next.js App Router, TypeScript, Tailwind, Prisma, PostgreSQL</stack>
>   <constraints>mobile-responsive; no over-engineering; explain trade-offs briefly when you make a choice</constraints>
> </requirements>
> <process>
>   1. Propose architecture: DB schema, API routes, component tree, folder structure.
>   2. Implementation plan as ordered milestones with acceptance criteria each.
>   3. Implement milestone by milestone; after each, list what to run and what I should see.
> </process>
> <output_format>Start with the architecture proposal only. Do not write feature code until I approve it.</output_format>
> <self_check>Before finishing each milestone, verify: types compile, routes handle error states, empty states exist in the UI.</self_check>
> ```

(The other nine modes follow the same three-variant pattern; their Tier 1 templates are specified in §J and example outputs for all ten are in §W.)

---

## H. Prompt scoring rubric (deterministic, local)

Score = weighted checklist, computed in < 1 ms, no LLM. Same function scores the raw prompt and each variant, producing the `42 → 91` display.

| Signal | Detection heuristic | Weight |
|---|---|---|
| Clear task verb | starts with / contains imperative verb from lexicon | 15 |
| Specificity | length ≥ 12 words AND contains ≥ 1 concrete noun phrase (proper noun, number, tech term) | 15 |
| Context provided | mentions audience, situation, or includes pasted material (code block, data) | 15 |
| Output format specified | "format/list/table/JSON/markdown/steps/versions" or explicit structure request | 15 |
| Constraints present | "must/only/avoid/limit/keep/don't/max/min" patterns | 10 |
| Audience/tone | "for beginners/for my manager/formal/casual/ATS" | 10 |
| Success criteria / examples | "e.g./for example/should include/criteria/like this" | 10 |
| Right-sized (anti-bloat) | penalty −10 if > 400 words AND classified simple_question | 10 |

- Score bands: 0–39 weak (red), 40–69 okay (amber), 70–100 strong (green).
- The "missing elements" list = signals scoring 0, mapped to human labels ("No output format", "No constraints").
- **Mode-aware weighting:** each recipe can override weights (e.g. Research doubles citations/recency signals via extra rubric items; Simple Answer zeroes the constraints weight).

```ts
export function scorePrompt(text: string, mode: ModeId): ScoreResult {
  // returns { total: number; breakdown: SignalScore[]; missing: string[] }
}
```

---

## I. Classification logic

Local, rule-based, ordered by precedence. LLM classification is deliberately NOT used in v1 (cost, latency, privacy). Accuracy target: 85% on the test fixture set (§S); when unsure, fall back to `quick_improve` — a wrong-but-generic improvement is acceptable, a wrong specific one is not.

```ts
// src/shared/classify.ts — precedence order matters
const rules: ClassifierRule[] = [
  { mode: "coding_debug",  test: t => hasCodeBlock(t) && /\b(error|bug|fix|not work|broken|fails?|exception|traceback)\b/i.test(t) },
  { mode: "app_builder",   test: t => /\b(build|create|make|develop)\b/i.test(t) && /\b(app|application|website|site|tool|dashboard|crm|saas|platform|extension|api|bot)\b/i.test(t) },
  { mode: "agent_task",    test: t => /\b(implement|refactor|migrate|add (a )?feature|fix this repo|update the code|write the code)\b/i.test(t) },
  { mode: "resume_job",    test: t => /\b(resume|cv|cover letter|bullet|linkedin summary|interview answer|job application)\b/i.test(t) },
  { mode: "data_analysis", test: t => /\b(sql|query|pandas|dataframe|excel|spreadsheet|dataset|analyz|chart|pivot|kpi|metric)\b/i.test(t) },
  { mode: "research",      test: t => /\b(research|compare|competitors?|market|landscape|pros and cons|state of the art|literature)\b/i.test(t) },
  { mode: "writing",       test: t => /\b(email|essay|blog|post|caption|article|rewrite|paraphrase|tone|draft)\b/i.test(t) },
  { mode: "simple_answer", test: t => /^(what|who|when|where|why|how)\b/i.test(t) && wordCount(t) <= 12 },
];
// fallthrough → "quick_improve"
```

Detected mode is always shown as an editable chip — misclassification costs one tap, which also keeps the bar realistic for a rules engine.

---

## J. Rewriting engine design

### Tier 1 — local template engine (always available)

Each recipe's `localRewrite()` is deterministic slot-filling:

1. **Extract signals** from the raw prompt: main noun phrase (the subject), verbs, any pasted code/data blocks, mentioned technologies (lexicon match), mentioned audience/tone.
2. **Fill the recipe's template** with extracted signals; leave bracketed placeholders for what can't be inferred: `[paste your code below]`, `[who is this for?]`. Placeholders are visually highlighted in the preview so the user knows what to fill.
3. **Generate the three variants** by including progressively more slots: Simple = task + 1–2 slots; Structured = full slot set in labeled sections; Advanced (Tier 1 fallback) = Structured + process/self-check scaffolding.

Rule: **never invent facts.** Tier 1 may restructure and add scaffolding/placeholders, but must not fabricate context the user didn't give (no inventing a tech stack in Simple variant — that's opt-in via Structured's stated default).

Exception by design: App Builder's Structured/Advanced variants propose a default stack explicitly labeled as a proposal ("propose alternatives only if strongly justified") — this is scaffolding, not fabrication.

### Tier 2 — LLM rewrite (local-first, cloud optional)

**Provider ladder**, tried in order on each Advanced-tab request:

```
1. local    — Ollama (localhost:11434) or any OpenAI-compatible endpoint (LM Studio :1234, llama.cpp, vLLM)
2. cloud    — Anthropic or OpenAI via user's own key (BYOK), only if configured
3. fallback — Tier 1 template output with a "local template shown" note
```

Local is the **default and recommended** path: it costs nothing, works offline, and means even the AI-powered rewrite never leaves the machine. Cloud BYOK exists for users who don't want to install anything and for maximum rewrite quality.

**Recommended local models (prompt rewriting is an easy task — small instruct models handle it well):**

| Scenario | Model | Pull command | Size | Why |
|---|---|---|---|---|
| **Default recommendation** | Qwen3 4B | `ollama pull qwen3:4b` | ~2.5 GB | Punches far above its weight — response quality approaching much larger previous-gen models; strong instruction-following and structured/JSON output; runs on any 8 GB machine |
| Newest alternative | Qwen3.5 4B | `ollama pull qwen3.5:4b` | ~2.5 GB | Same footprint, native tool calling, 256K context, Apache 2.0 |
| CPU-only / weak laptop | Phi-4-mini (3.8B) | `ollama pull phi4-mini` | ~2.5 GB | Best CPU throughput in its class (~12 tok/s CPU) |
| Has a GPU (8 GB+ VRAM) | Qwen3 8B | `ollama pull qwen3:8b` | ~5 GB | Noticeably better rewrites, still fast (~40 tok/s on 8 GB VRAM) |

Do **not** default to reasoning models (deepseek-r1 family): they think before answering, which adds latency and buys nothing for a rewrite task.

**Ollama integration details (Cursor: implement exactly this):**

- **Detection:** on popover open, service worker does `GET http://localhost:11434/api/tags` with a 800 ms timeout. Success → local provider active, model list populated. Connection refused → Ollama not running → show setup CTA. HTTP 403 → Ollama running but blocking the extension origin → show the CORS fix (below).
- **CORS gotcha (this WILL bite):** Ollama validates the `Origin` header, and extension requests arrive as `chrome-extension://<id>`. The user must set `OLLAMA_ORIGINS=chrome-extension://*` (env var, or `launchctl setenv` on macOS / systemd override on Linux / system env var on Windows) and restart Ollama. The onboarding screen must show the copy-pasteable one-liner per OS and a "Test connection" button. Detect the 403 specifically and surface this fix, not a generic error.
- **Request:** use Ollama's OpenAI-compatible endpoint `POST /v1/chat/completions` so the same client code serves Ollama, LM Studio, and any custom base URL. Set `"response_format": {"type": "json_object"}` where supported; for native Ollama fall back to `POST /api/chat` with `"format": "json"` to hard-enforce the `{"structured": ..., "advanced": ...}` schema.
- **Generation params:** temperature 0.3, `max_tokens` capped at **700 for local** (vs 1500 cloud) — a rewrite is 300–500 tokens; capping keeps worst-case latency ~15–25 s on a 4B CPU model and under 10 s on GPU.
- **Streaming:** `"stream": true` for local; forward chunks from the service worker to the content script via a `chrome.runtime.Port` and render into the Advanced preview as they arrive. Parse the JSON progressively (accumulate, attempt parse on each chunk; render the `structured` field's partial text).
- **Timeouts:** local 30 s (streaming makes this tolerable), cloud 12 s. On timeout or invalid JSON after one retry → ladder falls through.
- **Redaction still runs** before the local call. Yes, localhost is private — but redaction-before-Tier-2 as an invariant keeps the code path identical for all providers and protects users who point the base URL at a remote server.
- **Quality guardrail:** small models occasionally answer the prompt instead of rewriting it. The Tier 2 meta-prompt's first line ("You rewrite user prompts. You do NOT answer them") matters most for local models; additionally, validate the output — if `structured` is > 3× the input length AND contains no bracketed placeholders AND the mode is a question mode, treat it as a failed rewrite and fall through to Tier 1.

Cloud path (unchanged): content script → service worker → `fetch` to provider API with BYOK; cheapest capable tier (Claude Haiku class / GPT-mini class); keys never touch content scripts.

### Tier 2 meta-prompt skeleton (per recipe)

```
You rewrite user prompts. You do NOT answer them.
Mode: {mode label + description}
Target model: {claude|chatgpt|generic} — {model-specific style rules, §M}
Rules:
- Preserve the user's intent and all facts; never invent specifics.
- Where information is missing, insert [bracketed placeholders].
- Right-size: {mode-specific length guidance}.
- Return ONLY valid JSON: {"structured": "...", "advanced": "..."}
User's raw prompt (secrets already redacted):
<raw_prompt>{text}</raw_prompt>
```

### Model-specific style rules (applied in Tier 2, and lightly in Tier 1)

| Target | Style rules injected |
|---|---|
| Claude | XML-style section tags; explicit action verbs ("implement", not "can you"); include `<self_check>`; examples when format matters |
| ChatGPT | Bold section labels; task → context → ideal output → constraints ordering; explicit audience/tone/length |
| Generic/Cursor | Plain markdown sections; implementation-first phrasing; "do not over-refactor"; acceptance criteria list |

Target model is auto-set from the current site (claude.ai → Claude, chatgpt.com → ChatGPT) and overridable in the popover.

---

## K. Privacy & security architecture

**Principles (also your marketing page):**

1. **Read scope:** only the prompt input element's value. Never chat history, never other page content. Enforced structurally: the adapter exposes exactly one method that returns input text.
2. **Network scope:** zero non-localhost network calls unless the user explicitly configures a cloud key. Tier 1 is fully offline; Tier 2's default path talks only to `localhost`. The only remote calls the extension can ever make are to `api.anthropic.com`/`api.openai.com`, and only with a user-entered key. v1 ships **no telemetry, no analytics, no remote config**.
3. **Key storage:** `chrome.storage.local` (not `sync` — keys shouldn't roam), only readable by the extension, only used in the service worker.
4. **Redaction pipeline** (runs locally before any LLM call):
   - Regex detectors: OpenAI/Anthropic/GitHub/Slack/AWS key formats, JWTs, `password=`/`token=` patterns, credit cards (Luhn-validated), SSNs, emails, phone numbers, IPv4/IPv6.
   - Entropy detector: base64/hex strings ≥ 24 chars with Shannon entropy > 4.0 → flagged as probable secret.
   - Replacement: `⟦REDACTED:api_key⟧` tokens; a map is kept in memory so redacted tokens can be re-substituted into the returned rewrite if the user chooses.
5. **Permissions minimalism (`manifest.json`):** `"permissions": ["storage"]`, `"host_permissions"` for the two chat sites plus `https://api.anthropic.com/*` and `https://api.openai.com/*`. No `tabs`, no `history`, no `<all_urls>`.
6. **Chrome Web Store compliance:** privacy policy page stating local-only processing, BYOK, no data sale, no retention; matches the Data Safety form exactly.

Threat model notes:
- Malicious page can't read extension storage (isolated world), but a compromised chat site could observe text the widget writes into the composer — same exposure as the user typing it, so no new surface.
- Prompt-injection via page content is out of scope because we never read page content beyond the input box.

---

## L. Chrome extension architecture (MV3)

```
┌─────────────────────────── chatgpt.com / claude.ai ───────────────────────────┐
│  Content script (isolated world)                                              │
│  ├─ siteAdapter (chatgpt | claude | generic)  — find input, read, write       │
│  ├─ InputWatcher — debounced observation of composer text                     │
│  └─ Widget host <prompt-pilot-root> (Shadow DOM, React)                       │
│        pill button · popover · variants · score · actions                     │
└────────────────────────────────┬───────────────────────────────────────────────┘
                                 │ chrome.runtime.sendMessage (typed protocol §O)
┌────────────────────────────────▼───────────────────────────────────────────────┐
│  Service worker (background)                                                   │
│  ├─ router.ts — message dispatch                                               │
│  ├─ llm/providerRouter.ts — anthropic.ts | openai.ts (BYOK fetch)              │
│  ├─ redaction happens BEFORE messages reach here (in shared code run in CS)    │
│  └─ storage.ts — settings, templates (chrome.storage.local)                    │
└─────────────────────────────────────────────────────────────────────────────────┘
Options page (React) — keys, defaults, per-site toggle, privacy explainer
```

Key implementation details Cursor must follow:

- **Shadow DOM, closed mode** for all injected UI; Tailwind compiled into the shadow root via a constructable stylesheet (use `@webcomponents` pattern or inline `<style>`; do NOT rely on page CSS).
- **Composer detection:** each adapter defines `findComposer(): HTMLElement | null` using 2–3 selector strategies tried in order, then a `MutationObserver` on `document.body` re-runs detection when the composer unmounts (both sites are SPAs that remount the composer on navigation).
- **Writing text back:** ChatGPT and Claude use `contenteditable`/ProseMirror-style composers. `element.value = x` will NOT work. Use: focus the element → `document.execCommand('selectAll')` → `document.execCommand('insertText', false, newText)`; fall back to dispatching `beforeinput`/`input` `InputEvent`s with `inputType: "insertText"`. The adapter owns this; write a test fixture per site.
- **Debounce** input reading at 600 ms; never read on every keystroke.
- **Build tooling:** Vite + `@crxjs/vite-plugin` (MV3 HMR support), TypeScript strict, Vitest for unit tests, Playwright against local fixture pages (§S).

### manifest.json (v1)

```json
{
  "manifest_version": 3,
  "name": "PromptPilot",
  "version": "0.1.0",
  "description": "Turn rough AI prompts into structured, model-ready prompts — locally and privately.",
  "permissions": ["storage"],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "http://localhost/*",
    "http://127.0.0.1/*",
    "https://api.anthropic.com/*",
    "https://api.openai.com/*"
  ],
  "background": { "service_worker": "src/background/index.ts", "type": "module" },
  "content_scripts": [{
    "matches": ["https://chatgpt.com/*", "https://claude.ai/*"],
    "js": ["src/content/index.ts"],
    "run_at": "document_idle"
  }],
  "options_page": "src/options/index.html",
  "commands": {
    "open-improver": {
      "suggested_key": { "default": "Alt+I" },
      "description": "Open PromptPilot for the focused input"
    }
  },
  "icons": { "16": "icons/16.png", "48": "icons/48.png", "128": "icons/128.png" }
}
```

Note on BYOK network calls: the service worker `fetch` to `api.anthropic.com` requires the `anthropic-dangerous-direct-browser-access: true` header (Anthropic's documented flag for browser-context calls); OpenAI calls work with standard bearer auth. Both require the host_permissions above to bypass CORS.

---

## M. Site adapters

```ts
// src/content/adapters/types.ts
export interface SiteAdapter {
  id: "chatgpt" | "claude" | "generic";
  matches(url: URL): boolean;
  /** Try selectors in order; return null if not found (widget stays hidden) */
  findComposer(): HTMLElement | null;
  readText(el: HTMLElement): string;
  writeText(el: HTMLElement, text: string): boolean; // false → show Copy-only UI
  /** Where to anchor the pill, relative to composer rect */
  anchor(el: HTMLElement): { corner: "br" | "tr"; offsetX: number; offsetY: number };
  targetModel: "chatgpt" | "claude" | "generic";
}
```

- `chatgpt.ts`: try `#prompt-textarea`, then `div[contenteditable="true"][data-virtualkeyboard]`, then generic.
- `claude.ts`: try `div[contenteditable="true"].ProseMirror`, then `[data-testid*="composer"] [contenteditable]`, then generic.
- `generic.ts`: focused `textarea` or `[contenteditable="true"]` larger than 200×40 px.
- Selectors WILL rot. Keep them all in the adapter files only, covered by fixture tests, and structure the code so updating a selector is a one-line change.
- If `writeText` fails verification (read-back mismatch), degrade to Copy-only mode with a toast: "Couldn't insert automatically — copied to clipboard."

---

## N. Data model (chrome.storage.local)

```ts
interface StorageSchema {
  settings: {
    enabledSites: { chatgpt: boolean; claude: boolean };
    defaultVariant: "simple" | "structured" | "advanced";
    targetModelOverride: TargetModel | "auto";
    tier2ForStructured: boolean;      // default false
    redactionEnabled: boolean;        // default true, can't disable for known key formats
    shortcutEnabled: boolean;
  };
  providers: {
    local: {
      enabled: boolean;               // default true
      baseUrl: string;                // default "http://localhost:11434" (Ollama); user-editable for LM Studio (:1234) etc.
      model: string;                  // default "qwen3:4b"; picker populated from /api/tags
      lastDetected: number | null;    // timestamp of last successful /api/tags
    };
    anthropicKey?: string;            // stored as-is in storage.local; never logged
    openaiKey?: string;
    ladder: ("local" | "anthropic" | "openai")[];  // default ["local", "anthropic", "openai"]
  };
  templates: SavedTemplate[];         // max 200
}

interface SavedTemplate {
  id: string;              // nanoid
  name: string;
  mode: ModeId;
  body: string;            // may contain {selection} placeholder
  createdAt: number;
  usageCount: number;
}
```

No database, no migrations beyond a `schemaVersion` int with an upgrade switch.

## O. Internal message protocol (content script ↔ service worker)

```ts
type Msg =
  | { kind: "IMPROVE_REQUEST";  payload: { raw: string; redacted: string; redactions: RedactionMap; mode: ModeId; target: TargetModel; wantTier2: boolean } }
  | { kind: "IMPROVE_RESPONSE"; payload: { variants: VariantSet; scoreBefore: ScoreResult; scoreAfter: ScoreResult; source: "local" | "llm" | "llm_fallback_local"; warnings: string[] } }
  | { kind: "GET_SETTINGS" } | { kind: "SETTINGS"; payload: StorageSchema["settings"] }
  | { kind: "SAVE_TEMPLATE"; payload: SavedTemplate }
  | { kind: "LLM_ERROR"; payload: { provider: string; status: number; message: string } };
```

All messages validated with zod at both ends. Tier 1 rewrites and scoring run in the content-script bundle (shared code) so the popover renders instantly; only Tier 2 crosses to the worker.

---

## P. Folder structure

```
promptpilot/
  manifest.json
  vite.config.ts
  package.json
  src/
    shared/
      types.ts            # ModeId, Recipe, VariantSet, Msg, zod schemas
      classify.ts         # §I rules
      score.ts            # §H rubric
      redact.ts           # §K pipeline + tests
      recipes/
        index.ts
        quickImprove.ts  simpleAnswer.ts  research.ts  appBuilder.ts
        codingDebug.ts   resumeJob.ts     writing.ts   dataAnalysis.ts
        agentTask.ts
      styleRules.ts       # model-specific rules (§J table)
    content/
      index.ts            # bootstrap: pick adapter, mount watcher + widget
      inputWatcher.ts
      adapters/ { types.ts, chatgpt.ts, claude.ts, generic.ts }
      widget/
        WidgetRoot.tsx    # shadow-dom host
        Pill.tsx  Popover.tsx  VariantTabs.tsx  ScoreRow.tsx
        SecretsChip.tsx  Toast.tsx
        styles.css        # tailwind entry, compiled into shadow root
    background/
      index.ts  router.ts  storage.ts
      llm/ { providerRouter.ts, anthropic.ts, openai.ts, metaPrompt.ts }
    options/
      index.html  Options.tsx  KeyForm.tsx  PrivacyExplainer.tsx
  tests/
    unit/    { classify.test.ts, score.test.ts, redact.test.ts, recipes.test.ts }
    fixtures/{ chatgpt-composer.html, claude-composer.html, prompts.json }
    e2e/     { widget.spec.ts, replace.spec.ts }   # Playwright vs fixture pages
  icons/
```
---

## Q. Implementation plan (Cursor-ready milestones)

Work strictly in order. Each milestone ends with passing tests and a manually verifiable behavior. Do not start a milestone until the previous one's acceptance criteria pass.

**M0 — Scaffold (½ day)**
Vite + crxjs + React + TS strict + Tailwind + Vitest + Playwright. Empty content script logs `[PromptPilot] loaded` on chatgpt.com and claude.ai. Manifest as §L.
✅ Extension loads unpacked; log appears on both sites; `npm test` runs.

**M1 — Shared core: classify, score, redact (1–2 days)**
Implement `classify.ts`, `score.ts`, `redact.ts` with the fixture set `tests/fixtures/prompts.json` (≥ 60 labeled prompts, ≥ 6 per mode — write these first).
✅ Classifier ≥ 85% on fixtures; redactor catches all seeded secret formats with 0 false negatives on the seed list; score function returns stable breakdowns.

**M2 — Adapters + input watcher (1–2 days)**
Adapters per §M, fixture HTML pages copied from real DOM snapshots of both composers. `writeText` verified by read-back.
✅ Playwright: on both fixture pages, typing shows the pill; Replace inserts text and the composer's value matches.

**M3 — Widget UI, Tier 1 only (2–3 days)**
Shadow-DOM pill + popover + tabs + score row + Replace/Copy/Save + undo toast. All 9 recipes' `localRewrite` implemented.
✅ Full flow works offline on both fixture pages and live sites; no page CSS bleed; Escape/outside-click close; never auto-replaces.

**M4 — Templates + options page (1 day)**
Save/list/insert/delete templates; options page with per-site toggles and defaults.
✅ Templates persist across browser restart; toggling a site off removes the widget without reload (adapter checks settings).

**M5 — Tier 2: local-first provider ladder (2–3 days)**
Build in this order: (a) `local.ts` client against Ollama's OpenAI-compatible endpoint with streaming via `chrome.runtime.Port`, detection (`/api/tags`, 800 ms), model picker, and the 403→`OLLAMA_ORIGINS` onboarding screen; (b) `anthropic.ts`/`openai.ts` BYOK clients + key form; (c) `providerRouter.ts` implementing the ladder with per-provider timeouts (local 30 s, cloud 12 s), JSON validation with one retry, the small-model "answered instead of rewrote" guardrail, redaction in front, and redacted-token re-substitution.
✅ With Ollama + qwen3:4b running: Advanced tab streams a rewrite, first tokens < 3 s, complete < 25 s on CPU; Ollama stopped → BYOK used if configured, else CTA; Ollama returning 403 → the specific `OLLAMA_ORIGINS` fix screen (not a generic error); all providers dead → Tier 1 fallback + note; secrets never appear in any outbound request body including localhost (assert in a mock-server test); pointing baseUrl at a mock LM Studio (:1234) works unchanged.

**M6 — Polish + store prep (1–2 days)**
Dark mode, keyboard shortcut, empty/edge states (0-char, 10k-char prompt), icons, privacy policy page, store listing draft, Data Safety form answers.
✅ Passes the full test plan in §S; unpacked install → Web Store zip builds reproducibly.

Total: ~8–11 working days for a solo dev with AI assistance.

## R. v2 roadmap (post-launch, in order of leverage)

1. **Gemini + Perplexity + generic-site opt-in** (adapter additions only — architecture already supports it)
2. **Side Panel prompt library** (`chrome.sidePanel`) — browse/edit templates, prompt history (local, opt-in)
3. **"Explain why this prompt is weak"** — score breakdown → natural-language coaching (Tier 1 templated)
4. **Custom modes** — user-defined recipes (name + slots + template with placeholders)
5. **Hosted free tier + accounts** — this is when the backend appears: Node/Hono or FastAPI, Supabase (auth + Postgres), server-held key with metering (20 improvements/day free), Stripe for Pro. The extension's providerRouter gains a third provider: `"hosted"`. Nothing else changes client-side — this is why v1's BYOK-through-worker design matters.
6. **Team libraries, analytics, marketplace** — only after paid traction.

## S. Test plan & acceptance criteria

**Unit (Vitest):** classifier accuracy ≥ 85% on `tests/fixtures/prompts.json` fixtures where `stretch: false` (stretch fixtures are known-hard cases tracked but not gating); scorer monotonicity (adding a format spec never lowers the score); redactor: seeded corpus of 40 secrets across all formats → 100% catch, plus 40 benign strings (git SHAs, UUIDs) → ≤ 2 false positives; every recipe returns 3 non-empty variants for 5 sample inputs; Simple Answer advanced variant ≤ 60 words.

**E2E (Playwright on fixtures):** pill appears/hides at the 8-char threshold; popover opens ≤ 150 ms after click (Tier 1); Replace round-trips exactly (including emoji, newlines, 5k chars); Undo restores original; widget survives composer remount (simulate SPA nav by re-injecting fixture DOM).

**Manual release checklist:** live ChatGPT + live Claude smoke test; dark/light; no console errors; no network requests in DevTools until Tier 2 click; key never appears in any request log line; extension disabled on a site → zero DOM footprint.

**Product acceptance (v1 ship gate):**
- A user with no API key gets a visibly better structured prompt in ≤ 2 clicks.
- A Cursor-bound "build me X" prompt produces an Advanced variant that a cold LLM can execute into a plan without follow-up questions.
- "What is a SQL join" produces a *shorter-than-competitor* improvement (anti-bloat proof).
- Zero data leaves the machine in default configuration — verifiable in DevTools.

## T. Monetization (unchanged strategy, v2 timing)

Free: Tier 1 unlimited + BYOK unlimited (BYOK users cost you nothing — keep them free forever; they're your evangelists). Pro $8–10/mo: hosted key (no BYOK needed), unlimited hosted improvements, custom modes, history, priority mode updates. Team $18/user/mo: shared library, admin privacy controls. Do not gate Tier 1 or BYOK — the privacy story collapses if the free product phones home.

## U. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Composer DOM changes break adapters | Certain, recurring | Adapter isolation (§M), fixture tests, generic fallback, ship selector updates as fast patches; consider remote selector config in v2 (with signed config to avoid it becoming an attack vector) |
| Chrome Web Store review friction | Medium | Minimal permissions, exact Data Safety answers, privacy policy from day 1 |
| Competitors copy modes | High | Compete on classification quality + App Builder depth + privacy proof, not feature list |
| BYOK setup friction limits casual adoption | High | Tier 1 must be genuinely good standalone; hosted tier in v2 removes friction |
| Anthropic/OpenAI change browser-call policies | Low-medium | Provider layer abstracts this; hosted tier is the durable path |
| Prompt bloat reputation | Medium | Anti-bloat rubric penalty + Simple Answer mode + ship the "shorter is better" demo in marketing |

## V. Cursor kickoff prompt

Paste this into Cursor with this spec file in the repo root:

> Read `promptpilot-spec.md` in full before writing any code. Build the PromptPilot Chrome extension exactly as specified, following the milestone order in §Q strictly — do not skip ahead. Start with M0 (scaffold: Vite + @crxjs/vite-plugin + React + TypeScript strict + Tailwind + Vitest + Playwright, manifest from §L). After each milestone, stop, run the tests, show me the acceptance-criteria checklist for that milestone with pass/fail, and wait for my approval before continuing. Constraints: no backend, no telemetry, no permissions beyond those in the manifest in §L, all injected UI in closed Shadow DOM, Tier 1 must work fully offline. When implementing site adapters, use the fixture-first approach in §S. Ask me only if genuinely blocked; otherwise make the decision the spec implies and note it.

## W. Example outputs for the remaining modes (Tier 1 Structured variant)

1. **Quick Improve** — `explain binary search` → "Explain binary search for someone preparing for coding interviews: the intuition, when to use it vs. linear search, a small worked example, Python implementation, time/space complexity, and 2 common implementation mistakes."
2. **Simple Answer** — `what is sql join` → "Explain SQL joins simply using one small two-table example. Cover INNER, LEFT, RIGHT, and FULL OUTER JOIN. Beginner-friendly, no unnecessary theory."
3. **Research** — `research ai prompt extension market` → "Research the current market for browser extensions that improve AI prompts. Compare competitors on features, pricing, privacy positioning, and store presence. Prefer recent sources; cite them. Output: competitor table, gaps, and 3 differentiation opportunities. Flag anything uncertain."
4. **Coding Debug** — `why is my code not working` → "Act as a senior engineer. Debug the code below: identify the exact bug, explain why it happens, then give a corrected version with minimal changes — preserve my approach unless it's fundamentally broken. Note complexity if relevant.\n\n[paste your code and the error message below]"
5. **Resume** — `make this bullet better` → "Rewrite the resume bullet below for a [target role] position. ATS-friendly, quantified, impact-first, truthful to the original experience. Give 3 versions: concise, business-facing, technical.\n\n[paste your bullet]"
6. **Writing** — `write email to my manager about deadline` → "Write a short professional email to my manager requesting a deadline extension on [project]. Tone: accountable, not apologetic-spiraling. Include: current status, reason, new proposed date, mitigation. ≤ 120 words. Give 2 versions: direct and softer."
7. **Data Analysis** — `analyze this sales data` → "Analyze the dataset below. Business question: [what do you want to learn?]. Provide: key metrics, 3 insights ranked by impact, anomalies worth checking, and the Python/pandas code used. State assumptions explicitly.\n\n[paste data or schema]"
8. **Agent Task** — `fix the login bug` → "Implement the fix — don't just suggest it. Diagnose the login bug, state the root cause in one paragraph, apply the minimal patch, run/describe the checks proving it works, and list any files changed. Do not refactor unrelated code. Ask only if blocked."
9. **App Builder** — full example in §G.
10. **Custom** — user-defined; template stored verbatim with `{selection}` substitution.

---
*End of spec. Everything in §A–§S is v1 scope; treat §R/§T as context, not tasks.*
