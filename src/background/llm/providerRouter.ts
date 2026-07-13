import type { ModeId, TargetModel } from "../../shared/types";
import { improveTier1 } from "../../shared/improve";
import { getStorage } from "../storage";
import { callAnthropic } from "./anthropic";
import { callOpenAI } from "./openai";
import {
  applyRedactionRestore,
  callLocalLlm,
  LocalLlmError,
} from "./local";
import { buildMetaPrompt } from "./metaPrompt";

export interface ProviderRequest {
  raw: string;
  redacted: string;
  redactions: Record<string, string>;
  mode: ModeId;
  target: TargetModel;
  onChunk?: (text: string) => void;
}

export interface ProviderResponse {
  variants: { simple: string; structured: string; advanced: string };
  scoreAfter: ReturnType<typeof improveTier1>["scoreAfter"];
  source: "llm" | "llm_fallback_local";
  warnings: string[];
}

function isFailedRewrite(
  input: string,
  structured: string,
  mode: ModeId
): boolean {
  const questionModes: ModeId[] = ["simple_answer", "quick_improve"];
  if (!questionModes.includes(mode)) return false;
  const hasPlaceholders = /\[[^\]]+\]/.test(structured);
  return structured.length > input.length * 3 && !hasPlaceholders;
}

export async function runProviderLadder(
  req: ProviderRequest
): Promise<ProviderResponse> {
  const storage = await getStorage();
  const { providers } = storage;
  const tier1 = improveTier1(req.raw, req.target, req.mode);
  const warnings: string[] = [];

  const { system, user } = buildMetaPrompt(req.mode, req.target, req.redacted);

  for (const provider of providers.ladder) {
    try {
      let llmResult: { structured: string; advanced: string } | null = null;

      if (provider === "local" && providers.local.enabled) {
        try {
          llmResult = await callLocalLlm(providers, system, user, req.onChunk);
        } catch (err) {
          if (err instanceof LocalLlmError && err.status === 403) {
            warnings.push("OLLAMA_CORS");
            throw err;
          }
          continue;
        }
      }

      if (provider === "anthropic" && providers.anthropicKey) {
        llmResult = await callAnthropic(
          providers.anthropicKey,
          req.mode,
          req.target,
          req.redacted
        );
      }

      if (provider === "openai" && providers.openaiKey) {
        llmResult = await callOpenAI(
          providers.openaiKey,
          req.mode,
          req.target,
          req.redacted
        );
      }

      if (!llmResult) continue;

      const restored = applyRedactionRestore(llmResult, req.redactions);

      if (isFailedRewrite(req.raw, restored.structured, req.mode)) {
        warnings.push("Quality guardrail: model answered instead of rewriting");
        continue;
      }

      const variants = {
        simple: tier1.variants.simple,
        structured: restored.structured,
        advanced: restored.advanced,
      };

      const scoreAfter = improveTier1(restored.structured, req.target, req.mode).scoreAfter;

      return { variants, scoreAfter, source: "llm", warnings };
    } catch (err) {
      if (err instanceof LocalLlmError && err.status === 403) {
        throw err;
      }
      warnings.push(`${provider} failed`);
    }
  }

  return {
    variants: tier1.variants,
    scoreAfter: tier1.scoreAfter,
    source: "llm_fallback_local",
    warnings: [...warnings, "Using Tier 1 template — no LLM provider available"],
  };
}

export function getOllamaCorsMessage(): string {
  return `Ollama is blocking extension requests. Set OLLAMA_ORIGINS=chrome-extension://* and restart Ollama.

Windows (PowerShell):
$env:OLLAMA_ORIGINS="chrome-extension://*"

macOS:
launchctl setenv OLLAMA_ORIGINS "chrome-extension://*"

Linux (systemd):
Environment="OLLAMA_ORIGINS=chrome-extension://*"`;
}
