import type { SiteAdapter } from "./adapters/types";

const MIN_CHARS = 8;
const DEBOUNCE_MS = 600;

export type InputCallback = (text: string, composer: HTMLElement) => void;

export class InputWatcher {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private observer: MutationObserver | null = null;
  private composer: HTMLElement | null = null;
  private listener: (() => void) | null = null;

  constructor(
    private adapter: SiteAdapter,
    private onUpdate: InputCallback,
    private onComposerChange: (composer: HTMLElement | null) => void
  ) {}

  start(): void {
    this.attach();
    // ChatGPT remounts the composer often; poll + observe.
    const sync = () => {
      const found = this.adapter.findComposer();
      if (found !== this.composer) {
        this.detachListener();
        this.composer = found;
        this.onComposerChange(found);
        if (found) {
          this.attachListener(found);
          console.log("[AskWise] composer found");
        }
      }
    };
    this.observer = new MutationObserver(sync);
    this.observer.observe(document.documentElement, { childList: true, subtree: true });
    const poll = window.setInterval(sync, 1000);
    (this as { pollId?: number }).pollId = poll;
  }

  stop(): void {
    if (this.observer) this.observer.disconnect();
    const pollId = (this as { pollId?: number }).pollId;
    if (pollId) window.clearInterval(pollId);
    this.detachListener();
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  private attach(): void {
    this.composer = this.adapter.findComposer();
    this.onComposerChange(this.composer);
    if (this.composer) this.attachListener(this.composer);
  }

  private attachListener(composer: HTMLElement): void {
    this.listener = () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        const text = this.adapter.readText(composer);
        this.onUpdate(text, composer);
      }, DEBOUNCE_MS);
    };

    composer.addEventListener("input", this.listener);
    composer.addEventListener("keyup", this.listener);
    this.listener();
  }

  private detachListener(): void {
    if (this.composer && this.listener) {
      this.composer.removeEventListener("input", this.listener);
      this.composer.removeEventListener("keyup", this.listener);
    }
    this.listener = null;
  }

  static shouldShowPill(text: string): boolean {
    return text.trim().length >= MIN_CHARS;
  }
}
