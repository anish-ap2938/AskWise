const OFFSCREEN_URL = "src/offscreen/index.html";
const OFFSCREEN_REASON = "WORKERS" as chrome.offscreen.Reason;
let creating: Promise<void> | null = null;

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

  creating = chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: [OFFSCREEN_REASON],
    justification: "Run WebGPU on-device language model for private prompt rewrites",
  });

  try {
    await creating;
  } finally {
    creating = null;
  }
}

export async function sendToOffscreen<T>(
  message: Record<string, unknown>
): Promise<T> {
  await ensureOffscreenDocument();
  return new Promise<T>((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response as T);
    });
  });
}
