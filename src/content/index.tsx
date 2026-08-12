import { createRoot } from "react-dom/client";
import { pickAdapter } from "./adapters";
import { loadIntentModel } from "../shared/intentModel";
import {
  DEFAULT_WIDGET_SETTINGS,
  WidgetApp,
  type WidgetSettings,
} from "./widget/WidgetApp";
import styles from "./widget/styles.css?inline";

const LOG_PREFIX = "[AskWise]";
const HOST_TAG = "askwise-root";
const STORAGE_KEY = "askwise";
const LEGACY_STORAGE_KEY = "promptpilot";

type StoredSettings = {
  enabledSites?: Record<string, boolean>;
  defaultVariant?: WidgetSettings["defaultVariant"];
  targetModelOverride?: WidgetSettings["targetModelOverride"];
};

function toWidgetSettings(stored: StoredSettings | undefined): WidgetSettings {
  return {
    defaultVariant: stored?.defaultVariant ?? DEFAULT_WIDGET_SETTINGS.defaultVariant,
    targetModelOverride:
      stored?.targetModelOverride ?? DEFAULT_WIDGET_SETTINGS.targetModelOverride,
  };
}

async function getSettings(): Promise<{
  enabled: boolean;
  widget: WidgetSettings;
}> {
  const fallback = { enabled: true, widget: DEFAULT_WIDGET_SETTINGS };

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn(`${LOG_PREFIX} settings timeout — defaulting to enabled`);
      resolve(fallback);
    }, 1500);

    try {
      chrome.runtime.sendMessage({ kind: "GET_SETTINGS" }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError || !response?.payload) {
          resolve(fallback);
          return;
        }
        const stored = response.payload as StoredSettings;
        const adapter = pickAdapter();
        const siteKey = adapter.id === "generic" ? "chatgpt" : adapter.id;
        resolve({
          enabled: stored.enabledSites?.[siteKey] ?? true,
          widget: toWidgetSettings(stored),
        });
      });
    } catch {
      clearTimeout(timeout);
      resolve(fallback);
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

  // Warm the intent classifier; rules cover us until it resolves.
  void loadIntentModel().then((ok) => {
    if (!ok) console.warn(`${LOG_PREFIX} intent model unavailable — using rules only`);
  });

  const { enabled, widget } = await getSettings();
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
  root.render(<WidgetApp adapter={adapter} enabled={enabled} settings={widget} />);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    const change = changes[STORAGE_KEY] ?? changes[LEGACY_STORAGE_KEY];
    if (!change) return;
    const next = change.newValue as { settings?: StoredSettings } | undefined;
    const siteKey = adapter.id === "generic" ? "chatgpt" : adapter.id;
    const newEnabled = next?.settings?.enabledSites?.[siteKey] ?? true;
    root.render(
      <WidgetApp
        adapter={adapter}
        enabled={newEnabled}
        settings={toWidgetSettings(next?.settings)}
      />
    );
    if (!newEnabled) host.remove();
  });

  console.log(`${LOG_PREFIX} widget mounted`);
}

bootstrap().catch((err) => console.error(`${LOG_PREFIX}`, err));
