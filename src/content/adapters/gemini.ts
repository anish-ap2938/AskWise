import type { SiteAdapter } from "./types";
import { genericAdapter, writeToElement } from "./generic";

const SELECTORS = [
  'rich-textarea div[contenteditable="true"]',
  'div[contenteditable="true"][aria-label*="prompt" i]',
  'div[contenteditable="true"][role="textbox"]',
  "main textarea",
];

export const geminiAdapter: SiteAdapter = {
  id: "gemini",
  matches: (url: URL) =>
    url.hostname === "gemini.google.com" || url.hostname.endsWith(".gemini.google.com"),
  findComposer: () => {
    for (const selector of SELECTORS) {
      const el = document.querySelector(selector);
      if (el instanceof HTMLElement && isUsable(el)) return el;
    }
    return genericAdapter.findComposer();
  },
  readText: (el) => genericAdapter.readText(el),
  writeText: (el, text) => writeToElement(el, text),
  anchor: () => ({ corner: "br" as const, offsetX: 12, offsetY: 12 }),
  targetModel: "gemini",
};

function isUsable(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 40 && rect.height > 20;
}
