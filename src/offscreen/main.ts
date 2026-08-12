import {
  CreateMLCEngine,
  hasModelInCache,
  prebuiltAppConfig,
  type AppConfig,
  type MLCEngine,
} from "@mlc-ai/web-llm";
import {
  ASKWISE_FT_MODEL_ID,
  askwiseFtConfigured,
  askwiseFtModelUrl,
} from "../shared/askwiseFtModel";
import { PACKAGED_MODEL_LIBS } from "../shared/modelLibs";
import { assertMlcModelJson } from "../shared/mlcArtifacts";
import {
  DEFAULT_ONDEVICE_MODEL,
  ONDEVICE_MAX_TOKENS,
  ONDEVICE_TEMPERATURE,
  type OnDeviceModelId,
} from "../shared/ondeviceModel";
import {
  humanizeOnDeviceError,
  setOnDeviceProgress,
} from "../shared/ondeviceProgress";
import { connectKeepAlivePort } from "../shared/runtimeMessage";

function buildAppConfig(): AppConfig {
  const model_list = prebuiltAppConfig.model_list.map((entry) => {
    const rel = PACKAGED_MODEL_LIBS[entry.model_id as OnDeviceModelId];
    if (!rel) return entry;
    return { ...entry, model_lib: chrome.runtime.getURL(rel) };
  });

  // Fine-tuned MLC weights from Hugging Face + packaged matching wasm.
  if (askwiseFtConfigured()) {
    const lib = PACKAGED_MODEL_LIBS[ASKWISE_FT_MODEL_ID];
    model_list.push({
      model: askwiseFtModelUrl(),
      model_id: ASKWISE_FT_MODEL_ID,
      model_lib: chrome.runtime.getURL(lib),
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
      },
    });
  }

  return {
    ...prebuiltAppConfig,
    model_list,
    // Cache API + HF's /api/resolve-cache redirects trip CORS from extension
    // pages and can cache HTML error pages as "JSON". IndexedDB uses fetch(),
    // which host_permissions allow.
    cacheBackend: "indexeddb",
  };
}

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
  progress: number;
  text: string;
  model: OnDeviceModelId;
  ready?: boolean;
}): void {
  void setOnDeviceProgress({
    status: payload.ready ? "ready" : "downloading",
    model: payload.model,
    progress: payload.progress,
    text: payload.text,
    error: undefined,
  });
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
    void setOnDeviceProgress({ model });
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

  const appConfig = buildAppConfig();
  const record = appConfig.model_list.find((item) => item.model_id === model);
  if (record?.model) {
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
        const cached = await hasModelInCache(req.model, buildAppConfig());
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
      await setOnDeviceProgress({
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
void hasModelInCache(DEFAULT_ONDEVICE_MODEL, buildAppConfig()).then((cached) => {
  if (cached && supportsWebGpu()) {
    void ensureEngine(DEFAULT_ONDEVICE_MODEL, "warmup").catch(() => {
      // Ignore warmup failures; first real request will retry.
    });
  }
});
