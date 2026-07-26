# Pre-ship smoke checklist

Run through this before uploading `askwise-*.zip` to the Chrome Web Store.

## Automated (must pass)

```bash
npm test
npm run eval
npm run test:e2e
npm run build
npm run zip
```

## Manual — widget (each site)

For ChatGPT, Claude, Gemini, Perplexity, DeepSeek, Copilot:

- [ ] Pill appears after ~8 characters in the composer
- [ ] Popover opens and stays fully on-screen (top / bottom / narrow window)
- [ ] Simple / Structured / Advanced tabs switch
- [ ] Replace inserts text; Undo toast restores original
- [ ] Copy works
- [ ] Esc and outside-click close the popover
- [ ] `Alt+I` opens the improver

## Manual — quality edges

- [ ] Long prompt still scores and rewrites
- [ ] Secret-looking text shows Secrets chip / redaction
- [ ] Attach a `.txt` and a `.pdf`; context appears in rewrite path
- [ ] ATS-style prompt shows a sub-recipe chip
- [ ] Placeholder like `[paste job posting]` is tappable / editable

## Manual — on-device AI

- [ ] Fresh install opens onboarding with download progress
- [ ] Progress reaches “ready” (or clear unsupported message without WebGPU)
- [ ] Advanced tab streams a spelling-corrected rewrite from the on-device model
- [ ] Refine updates the current prompt using the same on-device model
- [ ] Without WebGPU, Advanced shows a clear error while Simple / Structured still work
- [ ] Reload extension; cached model reports ready without full re-download

## Store package

- [ ] Version is `0.2.3` in `manifest.json` / `package.json`
- [ ] Zip is `askwise-0.2.3.zip` (not legacy `promptpilot.zip`)
- [ ] Listing copy matches `docs/store-listing.md`
- [ ] Six screenshots in `store-assets/` (or live replacements)
- [ ] Privacy policy URL points at `PRIVACY.md` / hosted `privacy-policy.html`
