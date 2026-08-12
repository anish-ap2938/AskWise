import { isReceivingEndError } from "../../shared/ondeviceProgress";

const OFFSCREEN_URL = "src/offscreen/index.html";
const OFFSCREEN_REASON = "WORKERS" as chrome.offscreen.Reason;
const OFFSCREEN_BLOBS = "BLOBS" as chrome.offscreen.Reason;
let creating: Promise<void> | null = null;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function supportsOffscreen(): boolean {
  return typeof chrome !== "undefined" && !!chrome.offscreen?.createDocument;
}

async function hasOffscreenDocument(): Promise<boolean> {
  const getContexts = chrome.runtime.getContexts as
    | ((filter: {
        contextTypes?: string[];
        documentUrls?: string[];
      }) => Promise<Array<{ contextType: string }>>)
    | undefined;

  if (!getContexts) {
    const clients = await (
      self as unknown as {
        clients?: { matchAll: () => Promise<Array<{ url: string }>> };
      }
    ).clients?.matchAll();
    return !!clients?.some((c) => c.url.endsWith(OFFSCREEN_URL));
  }

  const contexts = await getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
  });
  return contexts.length > 0;
}

export async function ensureOffscreenDocument(): Promise<void> {
  if (!supportsOffscreen()) {
    throw new Error(
      "On-device AI requires Chrome's offscreen documents (Chrome 109+)."
    );
  }
  if (await hasOffscreenDocument()) return;
  if (creating) {
    await creating;
    return;
  }

  creating = chrome.offscreen
    .createDocument({
      url: OFFSCREEN_URL,
      reasons: [OFFSCREEN_REASON, OFFSCREEN_BLOBS],
      justification:
        "Run WebGPU on-device language model for private prompt rewrites",
    })
    .catch(() =>
      chrome.offscreen.createDocument({
        url: OFFSCREEN_URL,
        reasons: [OFFSCREEN_REASON],
        justification:
          "Run WebGPU on-device language model for private prompt rewrites",
      })
    );

  try {
    await creating;
  } finally {
    creating = null;
  }
}

export async function sendToOffscreen<T>(
  message: Record<string, unknown>,
  timeoutMs?: number
): Promise<T> {
  await ensureOffscreenDocument();
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer =
      timeoutMs && timeoutMs > 0
        ? setTimeout(() => {
            if (settled) return;
            settled = true;
            reject(new Error("Timed out talking to the on-device engine."));
          }, timeoutMs)
        : null;

    chrome.runtime.sendMessage(message, (response) => {
      if (settled) return;
      if (timer) clearTimeout(timer);
      if (chrome.runtime.lastError) {
        settled = true;
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      settled = true;
      resolve(response as T);
    });
  });
}

/** Wait until the offscreen listener is actually registered (createDocument races). */
export async function ensureOffscreenReady(): Promise<void> {
  await ensureOffscreenDocument();
  for (let i = 0; i < 20; i++) {
    try {
      await sendToOffscreen({ type: "ONDEVICE_PING", requestId: `ping-${i}` }, 1500);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!isReceivingEndError(message) && !/Timed out talking/i.test(message)) {
        throw err;
      }
      if (!(await hasOffscreenDocument())) {
        await ensureOffscreenDocument();
      }
      await delay(200);
    }
  }
  throw new Error(
    "Could not establish connection. Receiving end does not exist."
  );
}
