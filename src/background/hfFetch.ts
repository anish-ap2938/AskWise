import {
  HF_FETCH_TEXT,
  fetchTextPreferringJson,
  isAllowedHfFetchUrl,
  isHfJsonArtifactUrl,
  type HfFetchTextResponse,
} from "../shared/hfJsonFetch";

const MAX_JSON_BYTES = 32 * 1024 * 1024;

export function setupHfFetchListener(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== HF_FETCH_TEXT || typeof message.url !== "string") {
      return false;
    }
    void handleHfFetchText(message.url).then(sendResponse, (err) =>
      sendResponse({
        ok: false,
        status: 0,
        contentType: "",
        body: "",
        error: err instanceof Error ? err.message : String(err),
      } satisfies HfFetchTextResponse)
    );
    return true;
  });
}

async function handleHfFetchText(url: string): Promise<HfFetchTextResponse> {
  if (!isAllowedHfFetchUrl(url) || !isHfJsonArtifactUrl(url)) {
    return {
      ok: false,
      status: 0,
      contentType: "",
      body: "",
      error: "Refused to fetch a non-Hugging-Face JSON URL.",
    };
  }

  const result = await fetchTextPreferringJson(url);
  if (result.body.length > MAX_JSON_BYTES) {
    return {
      ok: false,
      status: result.status,
      contentType: result.contentType,
      body: "",
      error: "Hugging Face JSON was larger than expected.",
    };
  }
  return {
    ok: result.status >= 200 && result.status < 300,
    status: result.status,
    contentType: result.contentType,
    body: result.body,
  };
}
