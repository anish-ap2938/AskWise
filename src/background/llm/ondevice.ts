import type { StorageSchema } from "../../shared/types";
import {
  DEFAULT_ONDEVICE_MODEL,
  DEFAULT_ONDEVICE_PROGRESS,
  type OnDeviceModelId,
  type OnDeviceProgress,
} from "../../shared/ondeviceModel";
import { parseJsonContent, tryParsePartial, type LlmRewriteResult } from "./parseLlmJson";
import { ensureOffscreenDocument, sendToOffscreen, supportsOffscreen } from "./offscreen";

const PROGRESS_KEY = "askwise_ondevice_progress";

export class OnDeviceLlmError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "OnDeviceLlmError";
  }
}

export async function getOnDeviceProgress(): Promise<OnDeviceProgress> {
  const result = await chrome.storage.local.get(PROGRESS_KEY);
  return (result[PROGRESS_KEY] as OnDeviceProgress | undefined) ?? {
    ...DEFAULT_ONDEVICE_PROGRESS,
  };
}

export async function setOnDeviceProgress(
  patch: Partial<OnDeviceProgress>
): Promise<OnDeviceProgress> {
  const current = await getOnDeviceProgress();
  const next: OnDeviceProgress = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  };
  await chrome.storage.local.set({ [PROGRESS_KEY]: next });
  return next;
}

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

export async function ensureOnDeviceModel(
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

  await setOnDeviceProgress({
    status: "downloading",
    model,
    progress: 0,
    text: "Starting model download…",
    error: undefined,
  });

  try {
    await ensureOffscreenDocument();
    const requestId = `ensure-${Date.now()}`;
    const response = await sendToOffscreen<{ ok: boolean; error?: string }>({
      type: "ONDEVICE_ENSURE",
      model,
      requestId,
    });
    if (!response?.ok) {
      throw new Error(response?.error ?? "Failed to load on-device model");
    }
    return setOnDeviceProgress({
      status: "ready",
      model,
      progress: 1,
      text: "Model ready",
      error: undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return setOnDeviceProgress({
      status: "error",
      model,
      progress: 0,
      text: message,
      error: message,
    });
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
    // Ensure weights are loaded before the first refine/Advanced call.
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
      throw new OnDeviceLlmError(0, response?.error ?? "On-device chat failed");
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
      err instanceof Error ? err.message : String(err)
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
    const response = await sendToOffscreen<{
      ok: boolean;
      cached?: boolean;
      webgpu?: boolean;
    }>({
      type: "ONDEVICE_HAS_CACHE",
      model,
      requestId: `cache-${Date.now()}`,
    });
    return {
      cached: !!response?.cached,
      webgpu: !!response?.webgpu,
    };
  } catch {
    return { cached: false, webgpu: true };
  }
}
