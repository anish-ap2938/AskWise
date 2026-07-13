import type { SiteAdapter } from "./types";
import { genericAdapter, writeToElement } from "./generic";

const SELECTORS = [
  'div[contenteditable="true"].ProseMirror',
  '[data-testid*="composer"] [contenteditable="true"]',
  'div.ProseMirror[contenteditable="true"]',
];

export const claudeAdapter: SiteAdapter = {
  id: "claude",
  matches: (url: URL) => url.hostname === "claude.ai",
  findComposer: () => {
    for (const selector of SELECTORS) {
      const el = document.querySelector(selector);
      if (el instanceof HTMLElement) return el;
    }
    return genericAdapter.findComposer();
  },
  readText: (el) => genericAdapter.readText(el),
  writeText: (el, text) => writeToElement(el, text),
  anchor: () => ({ corner: "br" as const, offsetX: 12, offsetY: 12 }),
  targetModel: "claude",
};
