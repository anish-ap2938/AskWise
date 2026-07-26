import type { ModeId } from "../types";

/**
 * A sub-recipe is pure data: a specialized template under a top-level mode,
 * selected by keyword triggers. Community contributions add entries to the
 * pack files — no engine changes needed.
 *
 * Taxonomy: parent mode → category → subcategory (label).
 *
 * Template tokens:
 *   {{request}} — the user's cleaned request (filler stripped, capitalized)
 *   {{code}}    — the user's code blocks, or a paste-here placeholder
 */
export interface SubRecipeDef {
  /** Unique id, conventionally "parent/slug", e.g. "resume_job/ats". */
  id: string;
  parent: ModeId;
  /**
   * Mid-level bucket under the parent mode, e.g. "email", "debug", "mvp".
   * Defaults from the id slug when omitted.
   */
  category?: string;
  label: string;
  /** Case-insensitive regex sources; scored by hit count + specificity. */
  triggers: string[];
  /** Optional boost when multiple sub-recipes match. */
  priority?: number;
  /** The main (structured) template. Required. */
  structured: string;
  /** Optional; derived from structured when absent. */
  simple?: string;
  /** Optional; derived from structured + a rigor footer when absent. */
  advanced?: string;
}
