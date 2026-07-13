import type { ModeId } from "../types";

/**
 * A sub-recipe is pure data: a specialized template under a top-level mode,
 * selected by keyword triggers. Community contributions add entries to the
 * pack files — no engine changes needed.
 *
 * Template tokens:
 *   {{request}} — the user's cleaned request (filler stripped, capitalized)
 *   {{code}}    — the user's code blocks, or a paste-here placeholder
 */
export interface SubRecipeDef {
  /** Unique id, conventionally "parent/slug", e.g. "resume_job/ats". */
  id: string;
  parent: ModeId;
  label: string;
  /** Case-insensitive regex sources; first sub-recipe with a matching trigger wins. */
  triggers: string[];
  /** The main (structured) template. Required. */
  structured: string;
  /** Optional; derived from structured when absent. */
  simple?: string;
  /** Optional; derived from structured + a rigor footer when absent. */
  advanced?: string;
}
