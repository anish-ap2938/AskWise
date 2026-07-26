import { improveTier1 } from "../shared/improve";
import { messageSchema } from "../shared/types";
import { DEFAULT_ONDEVICE_MODEL, type OnDeviceModelId } from "../shared/ondeviceModel";
import { getStorage, updateStorage } from "./storage";
import { runOnDeviceRewrite } from "./llm/ondeviceRewrite";
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
        const result = await runOnDeviceRewrite({
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
        port.postMessage({
          kind: "LLM_ERROR",
          payload: {
            provider: "ondevice",
            status: 0,
            message:
              err instanceof Error
                ? err.message
                : "The on-device rewrite failed. Try again after the model is ready.",
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
    const result = await runOnDeviceRewrite(payload);
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
    return {
      kind: "LLM_ERROR" as const,
      payload: {
        provider: "ondevice",
        status: 0,
        message:
          err instanceof Error
            ? err.message
            : "The on-device rewrite failed. Try again after the model is ready.",
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
    const content = await callOnDeviceRaw(storage.providers, system, user);

    return {
      kind: "REFINE_RESPONSE" as const,
      payload: parseRefineContent(content),
    };
  } catch (err) {
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
          " — wait for the on-device model to finish downloading, then try again.",
      },
    };
  }
}
