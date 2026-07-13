import { createRoot } from "react-dom/client";
import { pickAdapter } from "./adapters";
import { WidgetApp } from "./widget/WidgetApp";
import styles from "./widget/styles.css?inline";

const LOG_PREFIX = "[AskWise]";
const HOST_TAG = "askwise-root";
const STORAGE_KEY = "askwise";
const LEGACY_STORAGE_KEY = "promptpilot";

async function getSettings(): Promise<{ enabled: boolean }> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn(`${LOG_PREFIX} settings timeout — defaulting to enabled`);
      resolve({ enabled: true });
    }, 1500);

    try {
      chrome.runtime.sendMessage({ kind: "GET_SETTINGS" }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError || !response?.payload) {
          resolve({ enabled: true });
          return;
        }
        const adapter = pickAdapter();
        const siteKey = adapter.id === "generic" ? "chatgpt" : adapter.id;
        const enabled = response.payload.enabledSites?.[siteKey] ?? true;
        resolve({ enabled });
      });
    } catch {
      clearTimeout(timeout);
      resolve({ enabled: true });
    }
  });
}

async function bootstrap(): Promise<void> {
  console.log(`${LOG_PREFIX} loaded on`, window.location.href);

  if (document.querySelector(HOST_TAG) || document.querySelector("prompt-pilot-root")) {
    console.log(`${LOG_PREFIX} already mounted`);
    return;
  }

  const adapter = pickAdapter();
  console.log(`${LOG_PREFIX} adapter:`, adapter.id);

  const { enabled } = await getSettings();
  if (!enabled) {
    console.log(`${LOG_PREFIX} disabled for this site`);
    return;
  }

  const host = document.createElement(HOST_TAG);
  host.setAttribute("data-askwise", "1");
  const shadow = host.attachShadow({ mode: "open" });
  document.documentElement.appendChild(host);

  const styleEl = document.createElement("style");
  styleEl.textContent = styles;
  shadow.appendChild(styleEl);

  const container = document.createElement("div");
  shadow.appendChild(container);

  const root = createRoot(container);
  root.render(<WidgetApp adapter={adapter} enabled={enabled} />);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    const change = changes[STORAGE_KEY] ?? changes[LEGACY_STORAGE_KEY];
    if (!change) return;
    const next = change.newValue as
      | { settings?: { enabledSites?: Record<string, boolean> } }
      | undefined;
    const siteKey = adapter.id === "generic" ? "chatgpt" : adapter.id;
    const newEnabled = next?.settings?.enabledSites?.[siteKey] ?? true;
    root.render(<WidgetApp adapter={adapter} enabled={newEnabled} />);
    if (!newEnabled) host.remove();
  });

  console.log(`${LOG_PREFIX} widget mounted`);
}

bootstrap().catch((err) => console.error(`${LOG_PREFIX}`, err));
