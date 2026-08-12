import { CreateMLCEngine, hasModelInCache, type MLCEngine } from "@mlc-ai/web-llm";
import { assertMlcModelJson } from "../shared/mlcArtifacts";
import {
  buildOnDeviceAppConfig,
  findOnDeviceModelRecord,
} from "../shared/mlcAppConfig";
import {
  DEFAULT_ONDEVICE_MODEL,
  ONDEVICE_MAX_TOKENS,
  ONDEVICE_TEMPERATURE,
  type OnDeviceModelId,
} from "../shared/ondeviceModel";
import { humanizeOnDeviceError } from "../shared/ondeviceProgress";
import { connectKeepAlivePort } from "../shared/runtimeMessage";

type OffscreenRequest =
  | { type: "ONDEVICE_ENSURE"; model: OnDeviceModelId; requestId: string }
  | {
      type: "ONDEVICE_CHAT";
      model: OnDeviceModelId;
      requestId: string;
      system: string;
      user: string;
      stream: boolean;
    }
  | { type: "ONDEVICE_STATUS"; model: OnDeviceModelId; requestId: string }
  | { type: "ONDEVICE_HAS_CACHE"; model: OnDeviceModelId; requestId: string }
  | { type: "ONDEVICE_PING"; requestId: string };

let engine: MLCEngine | null = null;
let loadedModel: string | null = null;
let loading: Promise<MLCEngine> | null = null;
let heartbeat: number | null = null;

function supportsWebGpu(): boolean {
  const nav = navigator as Navigator & { gpu?: unknown };
  return typeof navigator !== "undefined" && !!nav.gpu;
}

function ignoreLastError(): void {
  void chrome.runtime.lastError;
}

function postProgress(payload: {
  requestId: string;
  progress?: number;
  text?: string;
  model: OnDeviceModelId;
  ready?: boolean;
  error?: string;
  status?: "downloading" | "ready" | "error";
}): void {
  // Offscreen may not have chrome.storage; the service worker persists this.
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;
  chrome.runtime.sendMessage(
    {
      type: "ONDEVICE_PROGRESS",
      ...payload,
    },
    ignoreLastError
  );
}

function startHeartbeat(model: OnDeviceModelId): void {
  stopHeartbeat();
  heartbeat = window.setInterval(() => {
    postProgress({ requestId: "heartbeat", model, status: "downloading" });
  }, 5000);
}

function stopHeartbeat(): void {
  if (heartbeat !== null) {
    window.clearInterval(heartbeat);
    heartbeat = null;
  }
}

async function ensureEngine(
  model: OnDeviceModelId,
  requestId: string
): Promise<MLCEngine> {
  if (engine && loadedModel === model) return engine;
  if (loading) return loading;

  if (!supportsWebGpu()) {
    throw new Error(
      "WebGPU is unavailable. On-device AI needs Chrome 113+ with WebGPU enabled."
    );
  }

  const appConfig = buildOnDeviceAppConfig();
  const record = findOnDeviceModelRecord(model, appConfig);
  if (!record) {
    throw new Error(
      `Cannot find model record in appConfig for ${model}. Please check if the model ID is correct and included in the model_list configuration.`
    );
  }
  if (record.model) {
    await assertMlcModelJson(record.model);
  }

  startHeartbeat(model);
  postProgress({
    requestId,
    progress: 0,
    text: "Starting model download…",
    model,
  });

  loading = CreateMLCEngine(model, {
    appConfig,
    initProgressCallback: (report) => {
      postProgress({
        requestId,
        progress: report.progress,
        text: report.text,
        model,
      });
    },
  })
    .then((created) => {
      engine = created;
      loadedModel = model;
      loading = null;
      stopHeartbeat();
      postProgress({
        requestId,
        progress: 1,
        text: "Model ready",
        model,
        ready: true,
      });
      return created;
    })
    .catch((err) => {
      loading = null;
      engine = null;
      loadedModel = null;
      stopHeartbeat();
      throw err;
    });

  return loading;
}

function reply(
  sendResponse: (response: unknown) => void,
  payload: unknown
): void {
  try {
    sendResponse(payload);
  } catch {
    // Service worker may have been killed; progress is already in storage.
  }
  ignoreLastError();
}

chrome.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
  const message = raw as OffscreenRequest | { type?: string };
  if (
    !message?.type ||
    ![
      "ONDEVICE_ENSURE",
      "ONDEVICE_CHAT",
      "ONDEVICE_STATUS",
      "ONDEVICE_HAS_CACHE",
      "ONDEVICE_PING",
    ].includes(message.type)
  ) {
    return false;
  }

  const req = message as OffscreenRequest;

  if (req.type === "ONDEVICE_PING") {
    sendResponse({ ok: true, pong: true });
    return false;
  }

  void (async () => {
    try {
      if (req.type === "ONDEVICE_HAS_CACHE") {
        const cached = await hasModelInCache(req.model, buildOnDeviceAppConfig());
        reply(sendResponse, { ok: true, cached, webgpu: supportsWebGpu() });
        return;
      }

      if (req.type === "ONDEVICE_STATUS") {
        reply(sendResponse, {
          ok: true,
          ready: loadedModel === req.model && !!engine,
          model: loadedModel,
          webgpu: supportsWebGpu(),
        });
        return;
      }

      if (req.type === "ONDEVICE_ENSURE") {
        await ensureEngine(req.model, req.requestId);
        reply(sendResponse, { ok: true, ready: true });
        return;
      }

      if (req.type === "ONDEVICE_CHAT") {
        const eng = await ensureEngine(req.model, req.requestId);
        const completion = await eng.chat.completions.create({
          messages: [
            { role: "system", content: req.system },
            { role: "user", content: req.user },
          ],
          temperature: ONDEVICE_TEMPERATURE,
          max_tokens: ONDEVICE_MAX_TOKENS,
          stream: req.stream,
          response_format: { type: "json_object" },
        });

        if (req.stream && Symbol.asyncIterator in Object(completion)) {
          let accumulated = "";
          for await (const chunk of completion as AsyncIterable<{
            choices: Array<{ delta?: { content?: string } }>;
          }>) {
            const piece = chunk.choices[0]?.delta?.content ?? "";
            if (!piece) continue;
            accumulated += piece;
            chrome.runtime.sendMessage(
              {
                type: "ONDEVICE_CHAT_CHUNK",
                requestId: req.requestId,
                text: accumulated,
              },
              ignoreLastError
            );
          }
          reply(sendResponse, { ok: true, content: accumulated });
          return;
        }

        const nonStream = completion as {
          choices: Array<{ message?: { content?: string } }>;
        };
        const content = nonStream.choices[0]?.message?.content?.trim() ?? "";
        reply(sendResponse, { ok: true, content });
        return;
      }

      reply(sendResponse, { ok: false, error: "Unknown offscreen request" });
    } catch (err) {
      const error = humanizeOnDeviceError(
        err instanceof Error ? err.message : String(err)
      );
      const model =
        "model" in req && req.model ? req.model : DEFAULT_ONDEVICE_MODEL;
      postProgress({
        requestId: "requestId" in req ? req.requestId : "error",
        model,
        status: "error",
        text: "Download stopped",
        error,
      });
      reply(sendResponse, { ok: false, error });
    }
  })();

  return true;
});

connectKeepAlivePort();

// Warm default model if already cached so Advanced feels instant.
void hasModelInCache(DEFAULT_ONDEVICE_MODEL, buildOnDeviceAppConfig()).then((cached) => {
  if (cached && supportsWebGpu()) {
    void ensureEngine(DEFAULT_ONDEVICE_MODEL, "warmup").catch(() => {
      // Ignore warmup failures; first real request will retry.
    });
  }
});
