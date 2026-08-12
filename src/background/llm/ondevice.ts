import type { StorageSchema } from "../../shared/types";
import {
  DEFAULT_ONDEVICE_MODEL,
  type OnDeviceModelId,
  type OnDeviceProgress,
} from "../../shared/ondeviceModel";
import {
  getOnDeviceProgress,
  humanizeOnDeviceError,
  isDownloadStale,
  isReceivingEndError,
  setOnDeviceProgress,
} from "../../shared/ondeviceProgress";
import {
  startDownloadKeepAlive,
  stopDownloadKeepAlive,
} from "../keepAlive";
import { parseJsonContent, tryParsePartial, type LlmRewriteResult } from "./parseLlmJson";
import {
  ensureOffscreenReady,
  sendToOffscreen,
  supportsOffscreen,
} from "./offscreen";

export {
  getOnDeviceProgress,
  setOnDeviceProgress,
} from "../../shared/ondeviceProgress";

export class OnDeviceLlmError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "OnDeviceLlmError";
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let ensureInFlight: Promise<OnDeviceProgress> | null = null;

export function setupOnDeviceProgressListener(): void {
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== "ONDEVICE_PROGRESS") return;
    void setOnDeviceProgress({
      status: message.ready ? "ready" : "downloading",
      model: message.model ?? DEFAULT_ONDEVICE_MODEL,
      progress: typeof message.progress === "number" ? message.progress : 0,
      text: message.text ?? "",
      error: undefined,
    });
  });
}

/** Kick off a download and return immediately so the UI message port can close. */
export async function startOnDeviceEnsure(
  model: OnDeviceModelId = DEFAULT_ONDEVICE_MODEL
): Promise<OnDeviceProgress> {
  if (!supportsOffscreen()) {
    return setOnDeviceProgress({
      status: "unsupported",
      model,
      progress: 0,
      text: "On-device AI needs Chrome 113+ with WebGPU.",
      error: "unsupported",
    });
  }

  const current = await getOnDeviceProgress();
  if (current.status === "ready" && current.model === model) {
    void ensureOnDeviceModel(model);
    return current;
  }

  const next = await setOnDeviceProgress({
    status: "downloading",
    model,
    progress: current.model === model ? current.progress : 0,
    text: current.model === model && current.text
      ? current.text
      : "Starting model download…",
    error: undefined,
  });
  void ensureOnDeviceModel(model);
  return next;
}

export async function ensureOnDeviceModel(
  model: OnDeviceModelId = DEFAULT_ONDEVICE_MODEL
): Promise<OnDeviceProgress> {
  if (ensureInFlight) return ensureInFlight;
  ensureInFlight = runEnsureOnDeviceModel(model).finally(() => {
    ensureInFlight = null;
  });
  return ensureInFlight;
}

async function runEnsureOnDeviceModel(
  model: OnDeviceModelId
): Promise<OnDeviceProgress> {
  if (!supportsOffscreen()) {
    return setOnDeviceProgress({
      status: "unsupported",
      model,
      progress: 0,
      text: "On-device AI needs Chrome 113+ with WebGPU.",
      error: "unsupported",
    });
  }

  await setOnDeviceProgress({
    status: "downloading",
    model,
    text: "Starting model download…",
    error: undefined,
  });
  await startDownloadKeepAlive();

  try {
    await ensureOffscreenReady();
    const requestId = `ensure-${Date.now()}`;
    const response = await sendToOffscreen<{ ok: boolean; error?: string }>({
      type: "ONDEVICE_ENSURE",
      model,
      requestId,
    });
    if (!response?.ok) {
      throw new Error(response?.error ?? "Failed to load on-device model");
    }
    const ready = await setOnDeviceProgress({
      status: "ready",
      model,
      progress: 1,
      text: "Model ready",
      error: undefined,
    });
    await stopDownloadKeepAlive();
    return ready;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isReceivingEndError(message)) {
      const recovered = await waitForOffscreenProgress(model);
      if (recovered.status === "ready" || recovered.status === "error") {
        await stopDownloadKeepAlive();
        return recovered;
      }
    }
    const failed = await setOnDeviceProgress({
      status: "error",
      model,
      text: "Download stopped",
      error: humanizeOnDeviceError(message),
    });
    await stopDownloadKeepAlive();
    return failed;
  }
}

async function waitForOffscreenProgress(
  model: OnDeviceModelId,
  timeoutMs = 120_000
): Promise<OnDeviceProgress> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const progress = await getOnDeviceProgress();
    if (progress.model === model && progress.status === "ready") return progress;
    if (progress.model === model && progress.status === "error") return progress;
    if (progress.status === "downloading" && isDownloadStale(progress)) {
      break;
    }
    await delay(1000);
  }
  return getOnDeviceProgress();
}

/** Called when the SW wakes (alarm or install) mid-download. */
export async function resumeOnDeviceIfNeeded(): Promise<void> {
  const progress = await getOnDeviceProgress();
  if (progress.status !== "downloading") {
    await stopDownloadKeepAlive();
    return;
  }
  await startDownloadKeepAlive();
  if (isDownloadStale(progress)) {
    void ensureOnDeviceModel(progress.model);
    return;
  }
  try {
    await ensureOffscreenReady();
  } catch {
    void ensureOnDeviceModel(progress.model);
  }
}

/** Low-level on-device completion; returns raw model text. */
export async function callOnDeviceRaw(
  providers: StorageSchema["providers"],
  system: string,
  user: string,
  onChunk?: (accumulated: string) => void
): Promise<string> {
  if (!providers.ondevice.enabled) {
    throw new OnDeviceLlmError(0, "On-device model disabled");
  }
  if (!supportsOffscreen()) {
    throw new OnDeviceLlmError(0, "On-device model unsupported in this browser");
  }

  const model = providers.ondevice.model;
  const requestId = `chat-${Date.now()}`;

  const chunkListener = (message: {
    type?: string;
    requestId?: string;
    text?: string;
  }) => {
    if (message?.type !== "ONDEVICE_CHAT_CHUNK") return;
    if (message.requestId !== requestId || !message.text || !onChunk) return;
    onChunk(message.text);
  };

  if (onChunk) {
    chrome.runtime.onMessage.addListener(chunkListener);
  }

  try {
    await ensureOnDeviceModel(model);

    const response = await sendToOffscreen<{
      ok: boolean;
      content?: string;
      error?: string;
    }>({
      type: "ONDEVICE_CHAT",
      model,
      requestId,
      system,
      user,
      stream: !!onChunk,
    });

    if (!response?.ok || !response.content) {
      throw new OnDeviceLlmError(
        0,
        humanizeOnDeviceError(response?.error ?? "On-device chat failed")
      );
    }

    await setOnDeviceProgress({
      status: "ready",
      model,
      progress: 1,
      text: "Model ready",
    });

    return response.content;
  } catch (err) {
    if (err instanceof OnDeviceLlmError) throw err;
    throw new OnDeviceLlmError(
      0,
      humanizeOnDeviceError(err instanceof Error ? err.message : String(err))
    );
  } finally {
    if (onChunk) {
      chrome.runtime.onMessage.removeListener(chunkListener);
    }
  }
}

export async function callOnDeviceLlm(
  providers: StorageSchema["providers"],
  system: string,
  user: string,
  onChunk?: (text: string) => void
): Promise<LlmRewriteResult> {
  const content = await callOnDeviceRaw(
    providers,
    system,
    user,
    onChunk
      ? (accumulated) => {
          const partial = tryParsePartial(accumulated);
          if (partial?.advanced) onChunk(partial.advanced);
          else if (partial?.structured) onChunk(partial.structured);
        }
      : undefined
  );
  return parseJsonContent(content);
}

export async function probeOnDeviceCache(
  model: OnDeviceModelId
): Promise<{ cached: boolean; webgpu: boolean }> {
  if (!supportsOffscreen()) {
    return { cached: false, webgpu: false };
  }
  try {
    await ensureOffscreenReady();
    const response = await sendToOffscreen<{
      ok: boolean;
      cached?: boolean;
      webgpu?: boolean;
    }>(
      {
        type: "ONDEVICE_HAS_CACHE",
        model,
        requestId: `cache-${Date.now()}`,
      },
      8000
    );
    return {
      cached: !!response?.cached,
      webgpu: !!response?.webgpu,
    };
  } catch {
    return { cached: false, webgpu: true };
  }
}
