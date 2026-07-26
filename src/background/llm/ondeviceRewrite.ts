import type { ModeId, TargetModel } from "../../shared/types";
import { improveTier1 } from "../../shared/improve";
import { restoreRedactions } from "../../shared/redact";
import { normalizePromptProse } from "../../shared/extract";
import { getStorage } from "../storage";
import { callOnDeviceLlm, OnDeviceLlmError } from "./ondevice";
import { buildMetaPrompt } from "./metaPrompt";

export interface OnDeviceRewriteRequest {
  raw: string;
  redacted: string;
  redactions: Record<string, string>;
  mode: ModeId;
  target: TargetModel;
  onChunk?: (text: string) => void;
}

export interface OnDeviceRewriteResponse {
  variants: { simple: string; structured: string; advanced: string };
  scoreAfter: ReturnType<typeof improveTier1>["scoreAfter"];
  source: "llm";
  warnings: string[];
}

function restoreRewrite(
  result: { structured: string; advanced: string },
  redactions: Record<string, string>
): { structured: string; advanced: string } {
  return {
    structured: restoreRedactions(
      normalizePromptProse(result.structured),
      redactions
    ),
    advanced: restoreRedactions(
      normalizePromptProse(result.advanced),
      redactions
    ),
  };
}

function answeredInsteadOfRewriting(
  input: string,
  structured: string,
  mode: ModeId
): boolean {
  const questionModes: ModeId[] = ["simple_answer", "quick_improve"];
  if (!questionModes.includes(mode)) return false;
  const hasPlaceholders = /\[[^\]]+\]/.test(structured);
  return structured.length > input.length * 3 && !hasPlaceholders;
}

export async function runOnDeviceRewrite(
  req: OnDeviceRewriteRequest
): Promise<OnDeviceRewriteResponse> {
  const storage = await getStorage();
  const tier1 = improveTier1(req.raw, req.target, req.mode);
  const { system, user } = buildMetaPrompt(req.mode, req.target, req.redacted, {
    structured: tier1.variants.structured,
    advanced: tier1.variants.advanced,
  });

  if (!storage.providers.ondevice.enabled) {
    throw new OnDeviceLlmError(
      0,
      "On-device AI is disabled. Enable it in AskWise Options."
    );
  }

  const llmResult = await callOnDeviceLlm(
    storage.providers,
    system,
    user,
    req.onChunk
  );
  const restored = restoreRewrite(llmResult, req.redactions);

  if (answeredInsteadOfRewriting(req.raw, restored.structured, req.mode)) {
    throw new OnDeviceLlmError(
      0,
      "The on-device model answered the task instead of rewriting the prompt. Try again."
    );
  }

  const variants = {
    simple: tier1.variants.simple,
    structured: restored.structured,
    advanced: restored.advanced,
  };
  const scoreAfter = improveTier1(
    restored.advanced,
    req.target,
    req.mode
  ).scoreAfter;

  return { variants, scoreAfter, source: "llm", warnings: [] };
}
