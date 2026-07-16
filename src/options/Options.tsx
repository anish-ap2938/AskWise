import { useCallback, useEffect, useState } from "react";
import type { SavedTemplate, StorageSchema } from "../shared/types";
import { DEFAULT_STORAGE } from "../shared/types";
import { detectOllama } from "../background/llm/local";
import { getOllamaCorsMessage } from "../background/llm/providerRouter";
import { KeyForm } from "./KeyForm";
import { OnDeviceSection } from "./OnDeviceSection";
import { PrivacyExplainer } from "./PrivacyExplainer";

export function Options() {
  const [storage, setStorage] = useState<StorageSchema>(DEFAULT_STORAGE);
  const [models, setModels] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["askwise", "promptpilot"], (result) => {
      const data = (result.askwise ?? result.promptpilot) as StorageSchema | undefined;
      if (!data) return;
      const merged: StorageSchema = {
        ...DEFAULT_STORAGE,
        ...data,
        providers: {
          ...DEFAULT_STORAGE.providers,
          ...data.providers,
          ondevice: {
            ...DEFAULT_STORAGE.providers.ondevice,
            ...data.providers?.ondevice,
          },
          local: {
            ...DEFAULT_STORAGE.providers.local,
            ...data.providers?.local,
          },
          ladder: data.providers?.ladder?.includes("ondevice")
            ? data.providers.ladder
            : DEFAULT_STORAGE.providers.ladder,
        },
      };
      setStorage(merged);
      if (!result.askwise && result.promptpilot) {
        chrome.storage.local.set({ askwise: merged });
        chrome.storage.local.remove("promptpilot");
      }
    });
  }, []);

  const persist = useCallback((next: StorageSchema) => {
    setStorage(next);
    chrome.storage.local.set({ askwise: next }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }, []);

  const testConnection = async () => {
    const result = await detectOllama(storage.providers.local.baseUrl);
    if (result.ok) {
      setModels(result.models);
      setConnectionStatus(`Connected — ${result.models.length} model(s) found`);
      persist({
        ...storage,
        providers: {
          ...storage.providers,
          local: { ...storage.providers.local, lastDetected: Date.now() },
        },
      });
    } else if (result.status === 403) {
      setConnectionStatus(getOllamaCorsMessage());
    } else if (result.status === 0) {
      setConnectionStatus(
        "Ollama not detected. Install from ollama.com, then run: ollama pull qwen3:4b"
      );
    } else {
      setConnectionStatus(`Error: HTTP ${result.status}`);
    }
  };

  const updateTemplate = (id: string, action: "delete") => {
    if (action === "delete") {
      persist({
        ...storage,
        templates: storage.templates.filter((t) => t.id !== id),
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">AskWise</h1>
        <p className="text-gray-600 mt-1">
          Turn rough AI prompts into structured, model-ready prompts — locally and privately.
        </p>
        {saved && <p className="text-green-600 text-sm mt-2">Settings saved.</p>}
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Sites</h2>
        {(["chatgpt", "claude", "gemini", "perplexity", "deepseek", "copilot"] as const).map((site) => (
          <label key={site} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={storage.settings.enabledSites[site] ?? true}
              onChange={(e) =>
                persist({
                  ...storage,
                  settings: {
                    ...storage.settings,
                    enabledSites: {
                      ...storage.settings.enabledSites,
                      [site]: e.target.checked,
                    },
                  },
                })
              }
            />
            <span className="capitalize">{site}</span>
          </label>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Defaults</h2>
        <label className="block">
          <span className="text-sm text-gray-600">Default variant</span>
          <select
            className="mt-1 block w-full rounded border px-3 py-2"
            value={storage.settings.defaultVariant}
            onChange={(e) =>
              persist({
                ...storage,
                settings: {
                  ...storage.settings,
                  defaultVariant: e.target.value as StorageSchema["settings"]["defaultVariant"],
                },
              })
            }
          >
            <option value="simple">Simple</option>
            <option value="structured">Structured</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">Target model</span>
          <select
            className="mt-1 block w-full rounded border px-3 py-2"
            value={storage.settings.targetModelOverride}
            onChange={(e) =>
              persist({
                ...storage,
                settings: {
                  ...storage.settings,
                  targetModelOverride: e.target.value as StorageSchema["settings"]["targetModelOverride"],
                },
              })
            }
          >
            <option value="auto">Auto (from site)</option>
            <option value="chatgpt">ChatGPT</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
            <option value="generic">Generic</option>
          </select>
        </label>
      </section>

      <OnDeviceSection storage={storage} onPersist={persist} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Optional: Ollama / LM Studio</h2>
        <p className="text-sm text-gray-600">
          For larger models (Qwen3 4B/8B) if you already run a local server. Falls through
          after the built-in on-device model.
        </p>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={storage.providers.local.enabled}
            onChange={(e) =>
              persist({
                ...storage,
                providers: {
                  ...storage.providers,
                  local: { ...storage.providers.local, enabled: e.target.checked },
                },
              })
            }
          />
          <span>Enable Ollama / LM Studio</span>
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">Base URL</span>
          <input
            className="mt-1 block w-full rounded border px-3 py-2"
            value={storage.providers.local.baseUrl}
            onChange={(e) =>
              persist({
                ...storage,
                providers: {
                  ...storage.providers,
                  local: { ...storage.providers.local, baseUrl: e.target.value },
                },
              })
            }
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">Model</span>
          {models.length > 0 ? (
            <select
              className="mt-1 block w-full rounded border px-3 py-2"
              value={storage.providers.local.model}
              onChange={(e) =>
                persist({
                  ...storage,
                  providers: {
                    ...storage.providers,
                    local: { ...storage.providers.local, model: e.target.value },
                  },
                })
              }
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="mt-1 block w-full rounded border px-3 py-2"
              value={storage.providers.local.model}
              onChange={(e) =>
                persist({
                  ...storage,
                  providers: {
                    ...storage.providers,
                    local: { ...storage.providers.local, model: e.target.value },
                  },
                })
              }
            />
          )}
        </label>
        <button
          type="button"
          className="rounded bg-violet-600 px-4 py-2 text-white text-sm"
          onClick={testConnection}
        >
          Test connection
        </button>
        {connectionStatus && (
          <pre className="text-xs bg-gray-100 p-3 rounded whitespace-pre-wrap">{connectionStatus}</pre>
        )}
      </section>

      <KeyForm
        anthropicKey={storage.providers.anthropicKey ?? ""}
        openaiKey={storage.providers.openaiKey ?? ""}
        onChange={(anthropicKey, openaiKey) =>
          persist({
            ...storage,
            providers: { ...storage.providers, anthropicKey, openaiKey },
          })
        }
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Saved templates ({storage.templates.length})</h2>
        {storage.templates.length === 0 ? (
          <p className="text-sm text-gray-500">No templates saved yet.</p>
        ) : (
          <ul className="space-y-2">
            {storage.templates.map((t: SavedTemplate) => (
              <li key={t.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.mode}</p>
                </div>
                <button
                  type="button"
                  className="text-red-600 text-sm"
                  onClick={() => updateTemplate(t.id, "delete")}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PrivacyExplainer />
    </div>
  );
}
