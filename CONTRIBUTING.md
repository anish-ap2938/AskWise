# Contributing to AskWise

Thanks for helping people prompt AI better. The two highest-impact contributions need no
extension-development knowledge at all: **template packs** and **fixtures**.

## Add a template pack in 10 minutes

Sub-recipes are pure data. Each one is a specialized template under a top-level mode,
selected by keyword triggers.

**1. Pick (or create) a pack file** in `src/shared/subrecipes/packs/` — e.g. `career.ts`,
`writing.ts`, or a new `health.ts`.

**2. Add an entry:**

```ts
{
  id: "writing/wedding_speech",       // parent mode + slug, must be unique
  parent: "writing",                   // one of the 9 ModeIds
  label: "Wedding Speech",             // shown as a chip in the popover
  triggers: ["wedding (speech|toast)", "best man", "maid of honor"],  // case-insensitive regex
  structured: `You are a speechwriter who writes for the ear, not the page. {{request}}

**Rules:**
- One true story beats five adjectives.
- ...`,
}
```

Available tokens: `{{request}}` (the user's cleaned request) and `{{code}}` (their code
blocks, or a paste-here placeholder). `simple` and `advanced` variants are derived
automatically unless you provide them.

**3. Register a new pack** (only if you created a new file) in
`src/shared/subrecipes/index.ts` — one import + one spread.

**4. Verify:** `npm test` (schema/rendering checks run automatically) and `npm run eval`.

**Template quality bar** (what gets merged):

- Gives the AI a demanding role and concrete method — not "please help with X".
- Asks for specifics the user forgot (but max 2-3 questions, or assume-and-state).
- Includes hard rules where the domain has failure modes (e.g. "never invent experience"
  for resumes, "measure before optimizing" for performance).
- Zero filler. Every line must earn its place.

## Add fixtures (real prompts)

`tests/fixtures/prompts.json` is the classifier's exam. Add prompts you (or people you
know) actually typed into an AI chat:

```json
{ "id": "wr-33", "text": "write a rap verse about my dog", "expected": "writing", "stretch": false }
```

- `expected` is the ground-truth mode. If the rule classifier can't get it (keyword-free
  paraphrase), mark `"stretch": true` — stretch cases are tracked but don't gate CI.
- Never relabel a fixture to make tests pass; fix the lexicon or rules instead.
- Run `npm run eval` — gated accuracy must stay ≥ 85% (it's currently 100%).

## Code contributions

```bash
npm install
npm run dev     # fixture pages for manual testing
npm test        # must pass
npm run eval    # must pass the gate
npm run build   # must compile clean
```

- TypeScript, strict. Pure logic lives in `src/shared/` and gets unit tests.
- New site adapter? Copy `src/content/adapters/gemini.ts` (~40 lines), add the host to
  `manifest.json` (`content_scripts.matches` + `host_permissions`), register it in
  `adapters/index.ts`, and add the site key to `DEFAULT_STORAGE.settings.enabledSites`.
- Privacy is non-negotiable: no telemetry, no new network calls except user-configured
  LLM providers. PRs that phone home get closed.

## Good first issues

Look for the `good-first-issue` label — typically: new sub-recipes, new fixtures, a new
site adapter, or copy improvements in the popover/onboarding.
