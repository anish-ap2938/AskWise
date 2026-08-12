# Launch plan

Counts quoted below drift as template packs land. Re-check before publishing:
`recipes.length` in `src/shared/recipes/index.ts` and `allSubRecipes.length` in
`src/shared/subrecipes/index.ts`.

## Order of operations

1. **Make the repo public.** LICENSE, README with the demo GIF, CONTRIBUTING and PRIVACY
   are already in place.
2. **Submit to the Chrome Web Store.** Upload `askwise-0.2.6.zip` with the copy from
   `docs/store-listing.md` and the images in `store-assets/`. Expect a few days. The six
   host permissions and the Hugging Face CDN entries are the parts most likely to get a
   second look, so the permission justifications in the listing need to be filled in
   verbatim.
3. **Show HN**, once the listing is live so both links work.
4. **Product Hunt**, about a week later, reusing the same assets.

## Show HN draft

**Title:** Show HN: AskWise – a Chrome extension that rewrites your AI prompts locally

**Text:**

I kept watching friends type "write me a resume" into ChatGPT, get something generic back,
and conclude that AI is overrated. The gap between that and a prompt that works is mostly
mechanical: say who should answer, give the specifics, state the format, define what done
looks like. So I wrote an extension that does the mechanical part in front of you.

You type normally. A button appears next to the chat box with a score for what you've
written. Click it and you see three rewrites (one tightened sentence, a structured version
with sections and constraints, and one written by a model), a diff of what was added, and
the specific things your original was missing. Then Replace, or don't.

How it decides what to write: a rule engine plus a small classifier picks one of 18 request
types, then one of 200+ more specific templates — ATS resume screening, slow-query debugging,
salary negotiation, cold outreach. If it guesses wrong you change it from a dropdown.

The part I actually care about is that there is nowhere for your prompts to go. No server,
no account, no telemetry. Simple and Structured are plain local code. Advanced and Refine
run a ~1 GB model in the browser through WebGPU, downloaded once from Hugging Face. It's
MIT-licensed, and the templates are plain data, so a new template pack is a short PR.

On testing: a fixture suite of real prompts gates classification accuracy in CI, and
`npm run eval` scores every rewrite so template changes can't quietly make things worse.

Repo: [link] · Store: [link]

## Questions to expect

- **"Why not just teach people to prompt?"** That's what the score and the diff are for.
  The rewrite is the worked example; the named gaps are the lesson.
- **"Templates are canned."** Deliberately, for the fast path: instant, offline, and the
  same input always gives the same output, which means it can be tested. Advanced and
  Refine are where the model personalises it. And template PRs are welcome.
- **"An extension reading my prompts is a bad idea."** It reads the composer element and
  nothing else — no chat history, no page scraping. Each site adapter is about 40 lines,
  so this is quick to verify rather than take on faith.
- **"What about prompts with no obvious keywords?"** Weak spot, and the stretch fixtures
  track it. On-device embeddings are on hold because the host page's CSP blocks loading
  ONNX from a CDN.
- **"Why is the model download so big?"** Because it's a real model, running locally. The
  1 GB option is the default; there's a 0.7 GB one for slower machines, and everything
  except Advanced and Refine works without downloading anything.

## Repo hygiene checklist

- [x] Demo GIF at the top of the README (`docs/assets/demo.gif` via `npm run capture:assets`)
- [x] Issue templates (bug / template pack / fixture batch) and `GOOD_FIRST_ISSUES.md`
- [x] Store listing and privacy copy match the on-device WebLLM / `offscreen` architecture
- [x] Smoke checklist in `docs/smoke-checklist.md`
- [ ] `npm run zip` → `askwise-0.2.6.zip` (bump the version in this file when it changes)
- [ ] Open the six good-first issues from `.github/GOOD_FIRST_ISSUES.md`
- [ ] Tag `v0.2.6` and attach the zip to the release
- [ ] Manual pass on live ChatGPT / Claude / Gemini / Perplexity / DeepSeek / Copilot
      (see the smoke checklist) — fixtures don't catch composer changes
