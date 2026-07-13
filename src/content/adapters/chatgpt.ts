import type { SiteAdapter } from "./types";
import { genericAdapter, writeToElement } from "./generic";

const SELECTORS = [
  "#prompt-textarea",
  '[data-testid="prompt-textarea"]',
  'div[contenteditable="true"]#prompt-textarea',
  'div[contenteditable="true"][data-virtualkeyboard]',
  'form textarea',
  'textarea[name="prompt-textarea"]',
  'textarea[data-id="root"]',
  'main div[contenteditable="true"].ProseMirror',
  'main div[contenteditable="true"]',
];

export const chatgptAdapter: SiteAdapter = {
  id: "chatgpt",
  matches: (url: URL) =>
    url.hostname === "chatgpt.com" ||
    url.hostname.endsWith(".chatgpt.com") ||
    url.hostname === "chat.openai.com",
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
  targetModel: "chatgpt",
};

function isUsable(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 40 && rect.height > 20;
}
