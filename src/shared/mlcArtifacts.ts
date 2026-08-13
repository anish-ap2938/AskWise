import { looksLikeHtmlDocument } from "./ondeviceProgress";
import {
  fetchJsonViaBackground,
  isHfJsonArtifactUrl,
} from "./hfJsonFetch";

/** JSON files WebLLM 0.2.x reads before downloading weight shards. */
export const MLC_JSON_ARTIFACTS = [
  "mlc-chat-config.json",
  "tensor-cache.json",
] as const;

export function mlcArtifactUrl(modelUrl: string, filename: string): string {
  const base = modelUrl.endsWith("/") ? modelUrl : `${modelUrl}/`;
  return new URL(filename, base).href;
}

async function fetchArtifactResponse(url: string): Promise<Response> {
  if (
    isHfJsonArtifactUrl(url) &&
    typeof chrome !== "undefined" &&
    typeof chrome.runtime?.sendMessage === "function"
  ) {
    return fetchJsonViaBackground(url);
  }
  // Do not set Cache-Control: that header is not CORS-safelisted and
  // makes Chrome preflight HF's 307 /api/resolve-cache/ redirect, which
  // often surfaces as an HTML document instead of JSON.
  return fetch(url, {
    redirect: "follow",
    headers: { Accept: "application/json, text/plain, */*" },
  });
}

/**
 * Fetch a WebLLM JSON artifact and fail with a human message if HF
 * returned HTML (404 SPA, login wall) instead of JSON.
 */
export async function fetchMlcJsonArtifact(
  url: string,
  label: string
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchArtifactResponse(url);
  } catch {
    throw new Error(
      `Could not reach Hugging Face to download ${label}. Check your connection and try again.`
    );
  }

  const text = await response.text();

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      "This model isn't publicly downloadable from Hugging Face, so AskWise can't fetch it."
    );
  }

  if (looksLikeHtmlDocument(text) || response.status === 404) {
    throw new Error(
      `The model file “${label}” was missing or Hugging Face returned a web page instead of JSON. Wait a minute and try again.`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Hugging Face returned ${response.status} while fetching ${label}. Try again in a moment.`
    );
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(
      `The model file “${label}” was not valid model data. Try again in a moment.`
    );
  }
}

export async function assertMlcModelJson(modelUrl: string): Promise<void> {
  for (const filename of MLC_JSON_ARTIFACTS) {
    await fetchMlcJsonArtifact(mlcArtifactUrl(modelUrl, filename), filename);
  }
}
