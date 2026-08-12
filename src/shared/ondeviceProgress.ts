import {
  DEFAULT_ONDEVICE_PROGRESS,
  type OnDeviceProgress,
} from "./ondeviceModel";

export const ONDEVICE_PROGRESS_KEY = "askwise_ondevice_progress";

/** If no heartbeat lands for this long, treat the download as interrupted. */
export const DOWNLOAD_STALE_MS = 90_000;

export function isReceivingEndError(message: string | undefined): boolean {
  if (!message) return false;
  return /Receiving end does not exist|Could not establish connection|The message port closed before a response was received/i.test(
    message
  );
}

export function looksLikeHtmlDocument(text: string): boolean {
  const head = text.trimStart().slice(0, 64).toLowerCase();
  return (
    head.startsWith("<!doctype") ||
    head.startsWith("<html") ||
    head.startsWith("<!--")
  );
}

export function isHtmlAsJsonError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    /Unexpected token\s+'<'/i.test(message) ||
    /is not valid JSON/i.test(message) ||
    looksLikeHtmlDocument(message)
  );
}

/**
 * Map Chrome / WebLLM / HF failures to something a person can act on.
 * Real failures stay visible; raw MV3 and HTML-parse noise does not.
 */
export function humanizeOnDeviceError(raw: string | undefined): string {
  const message = (raw ?? "").trim();
  if (!message) {
    return "The model download didn't finish. Try again.";
  }
  if (isReceivingEndError(message)) {
    return "Chrome paused the extension during the download. Click Try again — it will pick up from the files already saved on this device.";
  }
  if (isHtmlAsJsonError(message)) {
    return "Hugging Face sent a web page instead of the model files (a missing file or a temporary error page). Wait a moment and try again.";
  }
  if (/Failed to fetch|NetworkError|network response was not ok|Load failed/i.test(message)) {
    return "The download lost its connection. Check that you're online and try again — already-fetched files stay cached.";
  }
  if (/\b401\b|\b403\b|gated|private repo/i.test(message)) {
    return "This model isn't publicly downloadable from Hugging Face, so AskWise can't fetch it.";
  }
  if (/\b404\b|not found/i.test(message)) {
    return "A required model file was missing on Hugging Face. Wait a minute for the upload to finish, then try again.";
  }
  if (/WebGPU is unavailable|shader-f16/i.test(message)) {
    return message;
  }
  return message;
}

export function isDownloadStale(
  progress: OnDeviceProgress,
  now = Date.now()
): boolean {
  return (
    progress.status === "downloading" &&
    progress.updatedAt > 0 &&
    now - progress.updatedAt > DOWNLOAD_STALE_MS
  );
}

export async function getOnDeviceProgress(): Promise<OnDeviceProgress> {
  const result = await chrome.storage.local.get(ONDEVICE_PROGRESS_KEY);
  return (
    (result[ONDEVICE_PROGRESS_KEY] as OnDeviceProgress | undefined) ?? {
      ...DEFAULT_ONDEVICE_PROGRESS,
    }
  );
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
  if (next.error) {
    next.error = humanizeOnDeviceError(next.error);
  }
  await chrome.storage.local.set({ [ONDEVICE_PROGRESS_KEY]: next });
  return next;
}
