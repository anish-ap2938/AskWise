import { improveTier1 } from "../shared/improve";
import { messageSchema } from "../shared/types";
import { getStorage, updateStorage } from "./storage";
import { getOllamaCorsMessage, runProviderLadder } from "./llm/providerRouter";
import { LocalLlmError } from "./llm/local";

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
