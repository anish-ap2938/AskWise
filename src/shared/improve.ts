import { classifyDetailed } from "./classify";
import { scorePrompt } from "./score";
import { redactSecrets } from "./redact";
import { getRecipe } from "./recipes";
import {
  findBestSubRecipe,
  findSubRecipe,
  renderSubRecipe,
  subRecipeCategory,
} from "./subrecipes";
import type { ModeId, ScoreResult, TargetModel, VariantSet } from "./types";

export interface ImproveResult {
  mode: ModeId;
  /** Set when a specialized sub-recipe matched (e.g. resume_job/ats). */
  subRecipe?: { id: string; label: string; category: string };
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
  const verdict = classifyDetailed(raw);
  const classified = modeOverride ?? verdict.mode;
  const ctx = { targetModel };

  const local = findSubRecipe(raw, classified);
  // A cross-mode sub-recipe may only rescue a classification we had little
  // confidence in. Letting one override a decided mode would silently undo
  // the routing the user sees on the mode chip.
  const rescuable = !modeOverride && (verdict.via === "fallback" || verdict.via === "model");
  const global = local || !rescuable ? null : findBestSubRecipe(raw);
  const sub = local ?? global;
  const mode = sub && !modeOverride ? sub.parent : classified;

  const variants = sub
    ? renderSubRecipe(sub, raw, ctx)
    : getRecipe(mode).localRewrite(raw, ctx);

  const scoreBefore = scorePrompt(raw, mode);
  const scoreAfter = scorePrompt(variants.structured, mode);
  const redaction = redactSecrets(raw);

  return {
    mode,
    subRecipe: sub
      ? {
          id: sub.id,
          label: sub.label,
          category: subRecipeCategory(sub),
        }
      : undefined,
    variants,
    scoreBefore,
    scoreAfter,
    redaction,
  };
}
