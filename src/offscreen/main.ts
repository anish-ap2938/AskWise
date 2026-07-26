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
import {
  DEFAULT_ONDEVICE_MODEL,
  ONDEVICE_MAX_TOKENS,
  ONDEVICE_TEMPERATURE,
  type OnDeviceModelId,
} from "../shared/ondeviceModel";

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
    });
  }

  return { ...prebuiltAppConfig, model_list };
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
  | { type: "ONDEVICE_HAS_CACHE"; model: OnDeviceModelId; requestId: string };

let engine: MLCEngine | null = null;
let loadedModel: string | null = null;
let loading: Promise<MLCEngine> | null = null;

function supportsWebGpu(): boolean {
  const nav = navigator as Navigator & { gpu?: unknown };
  return typeof navigator !== "undefined" && !!nav.gpu;
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

  loading = CreateMLCEngine(model, {
    appConfig: buildAppConfig(),
    initProgressCallback: (report) => {
      chrome.runtime.sendMessage({
        type: "ONDEVICE_PROGRESS",
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
      chrome.runtime.sendMessage({
        type: "ONDEVICE_PROGRESS",
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
      throw err;
    });

  return loading;
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
    ].includes(message.type)
  ) {
    return false;
  }

  const req = message as OffscreenRequest;

  void (async () => {
    try {
      if (req.type === "ONDEVICE_HAS_CACHE") {
        const cached = await hasModelInCache(req.model);
        sendResponse({ ok: true, cached, webgpu: supportsWebGpu() });
        return;
      }

      if (req.type === "ONDEVICE_STATUS") {
        sendResponse({
          ok: true,
          ready: loadedModel === req.model && !!engine,
          model: loadedModel,
          webgpu: supportsWebGpu(),
        });
        return;
      }

      if (req.type === "ONDEVICE_ENSURE") {
        await ensureEngine(req.model, req.requestId);
        sendResponse({ ok: true, ready: true });
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
          // Encourage JSON-only replies from small instruct models.
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
            chrome.runtime.sendMessage({
              type: "ONDEVICE_CHAT_CHUNK",
              requestId: req.requestId,
              text: accumulated,
            });
          }
          sendResponse({ ok: true, content: accumulated });
          return;
        }

        const nonStream = completion as {
          choices: Array<{ message?: { content?: string } }>;
        };
        const content = nonStream.choices[0]?.message?.content?.trim() ?? "";
        sendResponse({ ok: true, content });
        return;
      }

      sendResponse({ ok: false, error: "Unknown offscreen request" });
    } catch (err) {
      sendResponse({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  })();

  return true;
});

// Warm default model if already cached so Advanced feels instant.
void hasModelInCache(DEFAULT_ONDEVICE_MODEL).then((cached) => {
  if (cached && supportsWebGpu()) {
    void ensureEngine(DEFAULT_ONDEVICE_MODEL, "warmup").catch(() => {
      // Ignore warmup failures; first real request will retry.
    });
  }
});
