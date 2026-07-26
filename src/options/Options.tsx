import { useCallback, useEffect, useState } from "react";
import type { SavedTemplate, StorageSchema } from "../shared/types";
import { DEFAULT_STORAGE } from "../shared/types";
import { OnDeviceSection } from "./OnDeviceSection";
import { PrivacyExplainer } from "./PrivacyExplainer";

export function Options() {
  const [storage, setStorage] = useState<StorageSchema>(DEFAULT_STORAGE);
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
