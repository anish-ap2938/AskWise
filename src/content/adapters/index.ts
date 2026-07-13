import type { SiteAdapter } from "./types";
import { chatgptAdapter } from "./chatgpt";
import { claudeAdapter } from "./claude";
import { geminiAdapter } from "./gemini";
import { perplexityAdapter } from "./perplexity";
import { deepseekAdapter } from "./deepseek";
import { copilotAdapter } from "./copilot";
import { genericAdapter } from "./generic";

const adapters: SiteAdapter[] = [
  chatgptAdapter,
  claudeAdapter,
  geminiAdapter,
  perplexityAdapter,
  deepseekAdapter,
  copilotAdapter,
];

export function pickAdapter(url = window.location.href): SiteAdapter {
  const parsed = new URL(url);
  return adapters.find((a) => a.matches(parsed)) ?? genericAdapter;
}

export {
  chatgptAdapter,
  claudeAdapter,
  geminiAdapter,
  perplexityAdapter,
  deepseekAdapter,
  copilotAdapter,
  genericAdapter,
};
