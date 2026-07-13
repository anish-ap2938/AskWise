import type { SiteAdapter } from "./types";

function readContentEditable(el: HTMLElement): string {
  return el.innerText ?? el.textContent ?? "";
}

function readTextarea(el: HTMLTextAreaElement): string {
  return el.value;
}

export function writeToElement(el: HTMLElement, text: string): boolean {
  el.focus();

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return el.value === text;
  }

  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  const inserted = document.execCommand("insertText", false, text);
  if (!inserted) {
    el.textContent = text;
    el.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: text,
      })
    );
  }

  return readContentEditable(el) === text;
}

export const genericAdapter: SiteAdapter = {
  id: "generic",
  matches: () => true,
  findComposer() {
    const active = document.activeElement;
    if (active instanceof HTMLTextAreaElement && isLargeEnough(active)) {
      return active;
    }
    if (active instanceof HTMLElement && active.isContentEditable && isLargeEnough(active)) {
      return active;
    }

    const textareas = [...document.querySelectorAll("textarea")].filter(
      (el): el is HTMLTextAreaElement => el instanceof HTMLTextAreaElement && isLargeEnough(el)
    );
    if (textareas.length > 0) return textareas[textareas.length - 1]!;

    const editables = [...document.querySelectorAll('[contenteditable="true"]')].filter(
      (el): el is HTMLElement => el instanceof HTMLElement && isLargeEnough(el)
    );
    if (editables.length > 0) return editables[editables.length - 1]!;

    return null;
  },
  readText(el) {
    if (el instanceof HTMLTextAreaElement) return readTextarea(el);
    return readContentEditable(el);
  },
  writeText(el, text) {
    return writeToElement(el, text);
  },
  anchor() {
    return { corner: "br", offsetX: 8, offsetY: 8 };
  },
  targetModel: "generic",
};

function isLargeEnough(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 200 && rect.height > 40;
}
