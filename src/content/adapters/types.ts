import type { TargetModel } from "../../shared/types";

export interface AnchorConfig {
  corner: "br" | "tr";
  offsetX: number;
  offsetY: number;
}

export interface SiteAdapter {
  id: "chatgpt" | "claude" | "gemini" | "perplexity" | "deepseek" | "copilot" | "generic";
  matches(url: URL): boolean;
  findComposer(): HTMLElement | null;
  readText(el: HTMLElement): string;
  writeText(el: HTMLElement, text: string): boolean;
  anchor(el: HTMLElement): AnchorConfig;
  targetModel: TargetModel;
}
