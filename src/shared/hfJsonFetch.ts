import { looksLikeHtmlDocument } from "./ondeviceProgress";
import { sendToBackground } from "./runtimeMessage";

export const HF_FETCH_TEXT = "HF_FETCH_TEXT" as const;

export interface HfFetchTextRequest {
  type: typeof HF_FETCH_TEXT;
  url: string;
}

export interface HfFetchTextResponse {
  ok: boolean;
  status: number;
  contentType: string;
  body: string;
  error?: string;
}

const HF_HOST =
  /^(huggingface\.co|[\w-]+\.huggingface\.co|hf\.co|[\w.-]+\.hf\.co)$/i;

/** JSON artifacts WebLLM loads from the model URL before weight shards. */
export function isHfJsonArtifactUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (!HF_HOST.test(parsed.hostname)) return false;
    return /\.json$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function isAllowedHfFetchUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && HF_HOST.test(parsed.hostname);
  } catch {
    return false;
  }
}

function downloadTrueUrl(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("download", "true");
  return parsed.href;
}

function rawMirrorUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.includes("/resolve/")) return null;
    parsed.pathname = parsed.pathname.replace("/resolve/", "/raw/");
    parsed.search = "";
    return parsed.href;
  } catch {
    return null;
  }
}

/** Native fetch that avoids CORS-preflight headers like Cache-Control. */
export async function fetchHfJsonDirect(url: string): Promise<Response> {
  return fetch(url, {
    redirect: "follow",
    headers: { Accept: "application/json, text/plain, */*" },
  });
}

export async function fetchTextPreferringJson(url: string): Promise<{
  status: number;
  contentType: string;
  body: string;
}> {
  const candidates = [url, downloadTrueUrl(url)];
  const raw = rawMirrorUrl(url);
  if (raw) candidates.push(raw);

  let last = { status: 0, contentType: "", body: "" };
  for (const candidate of candidates) {
    const response = await fetchHfJsonDirect(candidate);
    const body = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    last = { status: response.status, contentType, body };
    if (
      response.ok &&
      !looksLikeHtmlDocument(body) &&
      !/text\/html/i.test(contentType)
    ) {
      return last;
    }
  }
  return last;
}

export async function fetchJsonViaBackground(url: string): Promise<Response> {
  const result = await sendToBackground<HfFetchTextResponse>({
    type: HF_FETCH_TEXT,
    url,
  });
  if (!result || result.error) {
    throw new Error(result?.error ?? "Hugging Face fetch failed");
  }
  return new Response(result.body, {
    status: result.status,
    headers: {
      "Content-Type": result.contentType || "application/json",
    },
  });
}

/**
 * Route Hugging Face JSON artifact fetches through the extension service
 * worker. Offscreen documents are CORS-bound; the SW is not, so it can
 * follow HF's /resolve/ → /api/resolve-cache/ redirects without getting
 * the HTML SPA.
 */
export function installHfJsonFetchProxy(): void {
  if (typeof globalThis.fetch !== "function") return;
  if (typeof chrome === "undefined" || typeof chrome.runtime?.sendMessage !== "function") {
    return;
  }

  const nativeFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (!isHfJsonArtifactUrl(url)) {
      return nativeFetch(input, init);
    }
    return fetchJsonViaBackground(url);
  }) as typeof fetch;
}
