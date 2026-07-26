import { z } from "zod";
import {
  DEFAULT_ONDEVICE_MODEL,
  type OnDeviceModelId,
} from "./ondeviceModel";

export type ModeId =
  | "quick_improve"
  | "simple_answer"
  | "research"
  | "app_builder"
  | "coding_debug"
  | "resume_job"
  | "writing"
  | "data_analysis"
  | "agent_task"
  | "custom";

export type SlotId =
  | "role"
  | "task"
  | "context"
  | "audience"
  | "constraints"
  | "output_format"
  | "examples"
  | "success_criteria"
  | "self_check"
  | "recency"
  | "citations"
  | "tech_stack"
  | "architecture"
  | "schema"
  | "testing"
  | "acceptance_criteria"
  | "tone"
  | "length";

export type TargetModel = "chatgpt" | "claude" | "gemini" | "generic";

export interface VariantSet {
  simple: string;
  structured: string;
  advanced: string;
}

export interface RewriteContext {
  targetModel: TargetModel;
  extracted?: ExtractedSignals;
}

export interface ExtractedSignals {
  subject: string;
  verbs: string[];
  codeBlocks: string[];
  technologies: string[];
  audience?: string;
  tone?: string;
}

export interface Recipe {
  id: ModeId;
  label: string;
  description: string;
  slots: SlotId[];
  localRewrite: (raw: string, ctx: RewriteContext) => VariantSet;
  llmSystemPrompt: (targetModel: TargetModel) => string;
}

export interface SignalScore {
  id: string;
  label: string;
  score: number;
  max: number;
}

export interface ScoreResult {
  total: number;
  breakdown: SignalScore[];
  missing: string[];
  band: "weak" | "okay" | "strong";
}

export interface RedactionMatch {
  type: string;
  original: string;
  token: string;
}

export type RedactionMap = Record<string, string>;

export interface RedactionResult {
  redacted: string;
  matches: RedactionMatch[];
  map: RedactionMap;
}

export interface SavedTemplate {
  id: string;
  name: string;
  mode: ModeId;
  body: string;
  createdAt: number;
  usageCount: number;
}

export interface StorageSchema {
  schemaVersion: number;
  settings: {
    enabledSites: Record<string, boolean>;
    defaultVariant: "simple" | "structured" | "advanced";
    targetModelOverride: TargetModel | "auto";
    tier2ForStructured: boolean;
    redactionEnabled: boolean;
    shortcutEnabled: boolean;
  };
  providers: {
    ondevice: {
      enabled: boolean;
      model: OnDeviceModelId;
    };
  };
  templates: SavedTemplate[];
}

export const DEFAULT_STORAGE: StorageSchema = {
  schemaVersion: 2,
  settings: {
    enabledSites: {
      chatgpt: true,
      claude: true,
      gemini: true,
      perplexity: true,
      deepseek: true,
      copilot: true,
    },
    defaultVariant: "structured",
    targetModelOverride: "auto",
    tier2ForStructured: false,
    redactionEnabled: true,
    shortcutEnabled: true,
  },
  providers: {
    ondevice: {
      enabled: true,
      model: DEFAULT_ONDEVICE_MODEL,
    },
  },
  templates: [],
};

export const modeIdSchema = z.enum([
  "quick_improve",
  "simple_answer",
  "research",
  "app_builder",
  "coding_debug",
  "resume_job",
  "writing",
  "data_analysis",
  "agent_task",
  "custom",
]);

export const improveRequestSchema = z.object({
  kind: z.literal("IMPROVE_REQUEST"),
  payload: z.object({
    raw: z.string(),
    redacted: z.string(),
    redactions: z.record(z.string()),
    mode: modeIdSchema,
    target: z.enum(["chatgpt", "claude", "gemini", "generic"]),
    wantTier2: z.boolean(),
  }),
});

export const improveResponseSchema = z.object({
  kind: z.literal("IMPROVE_RESPONSE"),
  payload: z.object({
    variants: z.object({
      simple: z.string(),
      structured: z.string(),
      advanced: z.string(),
    }),
    scoreBefore: z.object({
      total: z.number(),
      breakdown: z.array(
        z.object({ id: z.string(), label: z.string(), score: z.number(), max: z.number() })
      ),
      missing: z.array(z.string()),
      band: z.enum(["weak", "okay", "strong"]),
    }),
    scoreAfter: z.object({
      total: z.number(),
      breakdown: z.array(
        z.object({ id: z.string(), label: z.string(), score: z.number(), max: z.number() })
      ),
      missing: z.array(z.string()),
      band: z.enum(["weak", "okay", "strong"]),
    }),
    source: z.enum(["local", "llm"]),
    warnings: z.array(z.string()),
  }),
});

export const getSettingsSchema = z.object({ kind: z.literal("GET_SETTINGS") });

export const settingsResponseSchema = z.object({
  kind: z.literal("SETTINGS"),
  payload: z.object({
    enabledSites: z.record(z.boolean()),
    defaultVariant: z.enum(["simple", "structured", "advanced"]),
    targetModelOverride: z.enum(["chatgpt", "claude", "gemini", "generic", "auto"]),
    tier2ForStructured: z.boolean(),
    redactionEnabled: z.boolean(),
    shortcutEnabled: z.boolean(),
  }),
});

export const saveTemplateSchema = z.object({
  kind: z.literal("SAVE_TEMPLATE"),
  payload: z.object({
    id: z.string(),
    name: z.string(),
    mode: modeIdSchema,
    body: z.string(),
    createdAt: z.number(),
    usageCount: z.number(),
  }),
});

export const classifyRequestSchema = z.object({
  kind: z.literal("CLASSIFY_REQUEST"),
  payload: z.object({ text: z.string() }),
});

export const classifyResponseSchema = z.object({
  kind: z.literal("CLASSIFY_RESPONSE"),
  payload: z.object({
    mode: modeIdSchema,
    confidence: z.number(),
    source: z.enum(["rules", "embedding"]),
  }),
});

export const llmErrorSchema = z.object({
  kind: z.literal("LLM_ERROR"),
  payload: z.object({
    provider: z.string(),
    status: z.number(),
    message: z.string(),
  }),
});

export const getOnDeviceStatusSchema = z.object({
  kind: z.literal("GET_ONDEVICE_STATUS"),
});

export const ensureOnDeviceSchema = z.object({
  kind: z.literal("ENSURE_ONDEVICE"),
  payload: z
    .object({
      model: z.string().optional(),
    })
    .optional(),
});

export const refineRequestSchema = z.object({
  kind: z.literal("REFINE_REQUEST"),
  payload: z.object({
    currentPrompt: z.string(),
    history: z.array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    ),
    userMessage: z.string(),
  }),
});

export const refineResponseSchema = z.object({
  kind: z.literal("REFINE_RESPONSE"),
  payload: z.object({
    reply: z.string(),
    prompt: z.string().nullable(),
  }),
});

export const messageSchema = z.discriminatedUnion("kind", [
  improveRequestSchema,
  improveResponseSchema,
  getSettingsSchema,
  settingsResponseSchema,
  saveTemplateSchema,
  classifyRequestSchema,
  classifyResponseSchema,
  llmErrorSchema,
  getOnDeviceStatusSchema,
  ensureOnDeviceSchema,
  refineRequestSchema,
  refineResponseSchema,
]);

export type Msg = z.infer<typeof messageSchema>;
