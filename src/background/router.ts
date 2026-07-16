import { improveTier1 } from "../shared/improve";
import { messageSchema } from "../shared/types";
import { DEFAULT_ONDEVICE_MODEL, type OnDeviceModelId } from "../shared/ondeviceModel";
import { getStorage, updateStorage } from "./storage";
import { getOllamaCorsMessage, runProviderLadder } from "./llm/providerRouter";
import { LocalLlmError } from "./llm/local";
import {
  callOnDeviceRaw,
  ensureOnDeviceModel,
  getOnDeviceProgress,
  OnDeviceLlmError,
} from "./llm/ondevice";
import { buildRefineMessages, parseRefineContent } from "./llm/refinePrompt";
import type { RefineChatMessage } from "./llm/refinePrompt";

export function setupRouter(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const parsed = messageSchema.safeParse(message);
    if (!parsed.success) return false;

    const msg = parsed.data;

    if (msg.kind === "GET_SETTINGS") {
      void getStorage().then((storage) => {
        sendResponse({ kind: "SETTINGS", payload: storage.settings });
      });
      return true;
    }

    if (msg.kind === "SAVE_TEMPLATE") {
      void updateStorage((storage) => {
        const templates = [...storage.templates, msg.payload].slice(-200);
        return { ...storage, templates };
      }).then(() => sendResponse({ ok: true }));
      return true;
    }

    if (msg.kind === "IMPROVE_REQUEST") {
      void handleImprove(msg.payload).then(sendResponse);
      return true;
    }

    if (msg.kind === "GET_ONDEVICE_STATUS") {
      void getOnDeviceProgress().then((progress) => {
        sendResponse({ kind: "ONDEVICE_STATUS", payload: progress });
      });
      return true;
    }

    if (msg.kind === "ENSURE_ONDEVICE") {
      void (async () => {
        const storage = await getStorage();
        const model =
          (msg.payload?.model as OnDeviceModelId | undefined) ??
          storage.providers.ondevice.model ??
          DEFAULT_ONDEVICE_MODEL;
        if (msg.payload?.model && msg.payload.model !== storage.providers.ondevice.model) {
          await updateStorage((current) => ({
            ...current,
            providers: {
              ...current.providers,
              ondevice: {
                ...current.providers.ondevice,
                model: msg.payload!.model as OnDeviceModelId,
              },
            },
          }));
        }
        const progress = await ensureOnDeviceModel(model);
        sendResponse({ kind: "ONDEVICE_STATUS", payload: progress });
      })();
      return true;
    }

    if (msg.kind === "REFINE_REQUEST") {
      void handleRefine(msg.payload).then(sendResponse);
      return true;
    }

    return false;
  });

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== "tier2-stream") return;

    port.onMessage.addListener(async (message) => {
      const parsed = messageSchema.safeParse(message);
      if (!parsed.success || parsed.data.kind !== "IMPROVE_REQUEST") return;

      const payload = parsed.data.payload;
      const tier1 = improveTier1(payload.raw, payload.target, payload.mode);

      try {
        const result = await runProviderLadder({
          ...payload,
          onChunk: (text) => {
            port.postMessage({ kind: "STREAM_CHUNK", payload: { text } });
          },
        });

        port.postMessage({
          kind: "IMPROVE_RESPONSE",
          payload: {
            variants: result.variants,
            scoreBefore: tier1.scoreBefore,
            scoreAfter: result.scoreAfter,
            source: result.source,
            warnings: result.warnings,
          },
        });
      } catch (err) {
        if (err instanceof LocalLlmError && err.status === 403) {
          port.postMessage({
            kind: "LLM_ERROR",
            payload: {
              provider: "local",
              status: 403,
              message: getOllamaCorsMessage(),
            },
          });
          return;
        }
        port.postMessage({
          kind: "LLM_ERROR",
          payload: {
            provider: "unknown",
            status: 0,
            message: err instanceof Error ? err.message : "LLM request failed",
          },
        });
      }
    });
  });

  chrome.commands.onCommand.addListener((command) => {
    if (command === "open-improver") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { kind: "COMMAND_OPEN" });
        }
      });
    }
  });
}

async function handleImprove(payload: {
  raw: string;
  redacted: string;
  redactions: Record<string, string>;
  mode: import("../shared/types").ModeId;
  target: import("../shared/types").TargetModel;
  wantTier2: boolean;
}) {
  const tier1 = improveTier1(payload.raw, payload.target, payload.mode);

  if (!payload.wantTier2) {
    return {
      kind: "IMPROVE_RESPONSE" as const,
      payload: {
        variants: tier1.variants,
        scoreBefore: tier1.scoreBefore,
        scoreAfter: tier1.scoreAfter,
        source: "local" as const,
        warnings: [],
      },
    };
  }

  try {
    const result = await runProviderLadder(payload);
    return {
      kind: "IMPROVE_RESPONSE" as const,
      payload: {
        variants: result.variants,
        scoreBefore: tier1.scoreBefore,
        scoreAfter: result.scoreAfter,
        source: result.source,
        warnings: result.warnings,
      },
    };
  } catch (err) {
    if (err instanceof LocalLlmError && err.status === 403) {
      return {
        kind: "LLM_ERROR" as const,
        payload: {
          provider: "local",
          status: 403,
          message: getOllamaCorsMessage(),
        },
      };
    }
    return {
      kind: "IMPROVE_RESPONSE" as const,
      payload: {
        variants: tier1.variants,
        scoreBefore: tier1.scoreBefore,
        scoreAfter: tier1.scoreAfter,
        source: "llm_fallback_local" as const,
        warnings: ["LLM request failed"],
      },
    };
  }
}

async function handleRefine(payload: {
  currentPrompt: string;
  history: RefineChatMessage[];
  userMessage: string;
}) {
  const storage = await getStorage();
  const { system, user } = buildRefineMessages(
    payload.currentPrompt,
    payload.history,
    payload.userMessage
  );

  try {
    // Prefer on-device; if disabled/unavailable, hit Ollama with the same refine schema.
    let content: string;
    if (storage.providers.ondevice?.enabled) {
      content = await callOnDeviceRaw(storage.providers, system, user);
    } else if (storage.providers.local.enabled) {
      content = await callLocalRaw(storage.providers.local.baseUrl, storage.providers.local.model, system, user);
    } else {
      throw new OnDeviceLlmError(0, "No local model available");
    }

    return {
      kind: "REFINE_RESPONSE" as const,
      payload: parseRefineContent(content),
    };
  } catch (err) {
    // One fallback: if on-device failed, try Ollama once.
    if (storage.providers.ondevice?.enabled && storage.providers.local.enabled) {
      try {
        const content = await callLocalRaw(
          storage.providers.local.baseUrl,
          storage.providers.local.model,
          system,
          user
        );
        return {
          kind: "REFINE_RESPONSE" as const,
          payload: parseRefineContent(content),
        };
      } catch {
        // fall through
      }
    }

    const message =
      err instanceof OnDeviceLlmError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Refine failed";
    return {
      kind: "LLM_ERROR" as const,
      payload: {
        provider: "ondevice",
        status: 0,
        message:
          message +
          " — wait for the on-device model to finish downloading (or enable Ollama).",
      },
    };
  }
}

async function callLocalRaw(
  baseUrl: string,
  model: string,
  system: string,
  user: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const isQwen3 = /qwen3/i.test(model);
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 900,
        response_format: { type: "json_object" },
        ...(isQwen3 ? { think: false } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`Local model HTTP ${response.status}`);
    }
    const data = (await response.json()) as {
      choices: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("Empty local model response");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}
