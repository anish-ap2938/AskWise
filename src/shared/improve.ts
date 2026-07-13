import { classify } from "./classify";
import { scorePrompt } from "./score";
import { redactSecrets } from "./redact";
import { getRecipe } from "./recipes";
import { findSubRecipe, renderSubRecipe } from "./subrecipes";
import type { ModeId, ScoreResult, TargetModel, VariantSet } from "./types";

export interface ImproveResult {
  mode: ModeId;
  /** Set when a specialized sub-recipe matched (e.g. resume_job/ats). */
  subRecipe?: { id: string; label: string };
  variants: VariantSet;
  scoreBefore: ScoreResult;
  scoreAfter: ScoreResult;
  redaction: ReturnType<typeof redactSecrets>;
}

export function improveTier1(
  raw: string,
  targetModel: TargetModel,
  modeOverride?: ModeId
): ImproveResult {
  const mode = modeOverride ?? classify(raw);
  const ctx = { targetModel };

  const sub = findSubRecipe(raw, mode);
  const variants = sub
    ? renderSubRecipe(sub, raw, ctx)
    : getRecipe(mode).localRewrite(raw, ctx);

  const scoreBefore = scorePrompt(raw, mode);
  const scoreAfter = scorePrompt(variants.structured, mode);
  const redaction = redactSecrets(raw);

  return {
    mode,
    subRecipe: sub ? { id: sub.id, label: sub.label } : undefined,
    variants,
    scoreBefore,
    scoreAfter,
    redaction,
  };
}
