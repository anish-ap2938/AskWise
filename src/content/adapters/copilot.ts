import type { SiteAdapter } from "./types";
import { genericAdapter, writeToElement } from "./generic";

const SELECTORS = [
  "#userInput",
  'textarea[placeholder*="Message" i]',
  'textarea[aria-label*="Ask" i]',
  'div[contenteditable="true"][role="textbox"]',
  "main textarea",
];

export const copilotAdapter: SiteAdapter = {
  id: "copilot",
  matches: (url: URL) =>
    url.hostname === "copilot.microsoft.com" ||
    url.hostname.endsWith(".copilot.microsoft.com"),
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
  targetModel: "generic",
};

function isUsable(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 40 && rect.height > 20;
}
