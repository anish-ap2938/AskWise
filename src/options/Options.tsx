import { useCallback, useEffect, useState } from "react";
import type { SavedTemplate, StorageSchema } from "../shared/types";
import { DEFAULT_STORAGE } from "../shared/types";
import { getRecipe } from "../shared/recipes";
import { OnDeviceSection } from "./OnDeviceSection";
import { PrivacyExplainer } from "./PrivacyExplainer";
import { CheckIcon, ExternalIcon, Section, TrashIcon } from "./ui";

const SITES = [
  { key: "chatgpt", name: "ChatGPT", host: "chatgpt.com" },
  { key: "claude", name: "Claude", host: "claude.ai" },
  { key: "gemini", name: "Gemini", host: "gemini.google.com" },
  { key: "perplexity", name: "Perplexity", host: "perplexity.ai" },
  { key: "deepseek", name: "DeepSeek", host: "chat.deepseek.com" },
  { key: "copilot", name: "Copilot", host: "copilot.microsoft.com" },
] as const;

const VARIANTS = [
  { value: "simple", label: "Simple", hint: "One tightened paragraph." },
  { value: "structured", label: "Structured", hint: "Headed sections and constraints." },
  { value: "advanced", label: "Advanced", hint: "Rewritten by the on-device model." },
] as const;

const TARGETS = [
  { value: "auto", label: "Match the site I'm on" },
  { value: "chatgpt", label: "Always tune for ChatGPT" },
  { value: "claude", label: "Always tune for Claude" },
  { value: "gemini", label: "Always tune for Gemini" },
  { value: "generic", label: "Neutral phrasing" },
] as const;

function extensionVersion(): string {
  try {
    return chrome.runtime.getManifest?.().version ?? "";
  } catch {
    return "";
  }
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <span className="relative inline-flex flex-none items-center">
      <input
        type="checkbox"
        className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
        checked={checked}
        aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className="pointer-events-none flex h-5 w-9 items-center rounded-full border border-hairline-strong bg-sunken px-0.5 transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:[&>span]:translate-x-[18px] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"
      >
        <span className="h-3.5 w-3.5 rounded-full bg-surface shadow-card transition-transform" />
      </span>
    </span>
  );
}

export function Options() {
  const [storage, setStorage] = useState<StorageSchema>(DEFAULT_STORAGE);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const version = extensionVersion();

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

  const setSetting = <K extends keyof StorageSchema["settings"]>(
    key: K,
    value: StorageSchema["settings"][K]
  ) => persist({ ...storage, settings: { ...storage.settings, [key]: value } });

  const enabledCount = SITES.filter(
    (s) => storage.settings.enabledSites[s.key] ?? true
  ).length;

  return (
    <div className="mx-auto max-w-[680px] px-6 py-14">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">AskWise settings</h1>
          <p className="mt-2 max-w-prose text-base text-ink-muted">
            AskWise rewrites the prompt sitting in your chat composer. Everything on this
            page is stored on this device, and changes take effect immediately.
          </p>
        </div>
        {/* Fixed height so the confirmation never reflows the header. */}
        <div className="flex h-6 flex-none items-center" aria-live="polite">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-positive">
              <CheckIcon size={13} />
              Saved
            </span>
          )}
        </div>
      </header>

      <div className="mt-12 space-y-12">
        <Section
          title="Where AskWise appears"
          description={`The Improve button is injected on these six sites and nowhere else — ${enabledCount} of ${SITES.length} are on.`}
        >
          <ul className="card divide-y divide-hairline">
            {SITES.map((site) => {
              const on = storage.settings.enabledSites[site.key] ?? true;
              return (
                <li key={site.key} className="flex items-center gap-4 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{site.name}</span>
                    <span className="block text-xs text-ink-faint">{site.host}</span>
                  </span>
                  <Switch
                    checked={on}
                    label={`Show AskWise on ${site.name}`}
                    onChange={(next) =>
                      setSetting("enabledSites", {
                        ...storage.settings.enabledSites,
                        [site.key]: next,
                      })
                    }
                  />
                </li>
              );
            })}
          </ul>
        </Section>

        <Section
          title="Rewrite defaults"
          description="Which version of the rewrite you land on, and which model's phrasing habits to write for."
        >
          <div className="card divide-y divide-hairline">
            <label className="block px-4 py-4">
              <span className="field-label">Open on this variant</span>
              <select
                className="control mt-2"
                value={storage.settings.defaultVariant}
                onChange={(e) =>
                  setSetting(
                    "defaultVariant",
                    e.target.value as StorageSchema["settings"]["defaultVariant"]
                  )
                }
              >
                {VARIANTS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
              <span className="field-hint">
                {VARIANTS.find((v) => v.value === storage.settings.defaultVariant)?.hint}
              </span>
            </label>

            <label className="block px-4 py-4">
              <span className="field-label">Write for</span>
              <select
                className="control mt-2"
                value={storage.settings.targetModelOverride}
                onChange={(e) =>
                  setSetting(
                    "targetModelOverride",
                    e.target.value as StorageSchema["settings"]["targetModelOverride"]
                  )
                }
              >
                {TARGETS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <span className="field-hint">
                Changes small things like whether the prompt opens with XML-ish tags or a
                plain role line.
              </span>
            </label>
          </div>
        </Section>

        <OnDeviceSection storage={storage} onPersist={persist} />

        <Section
          title="Saved prompts"
          description="Prompts you kept with the Save button in the widget."
        >
          {storage.templates.length === 0 ? (
            <p className="card px-4 py-8 text-center text-sm text-ink-faint">
              Nothing saved yet. When a rewrite is worth reusing, hit{" "}
              <span className="font-medium text-ink-muted">Save</span> in the widget and it
              lands here.
            </p>
          ) : (
            <ul className="card divide-y divide-hairline">
              {storage.templates.map((t: SavedTemplate) => (
                <li key={t.id} className="flex items-start gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {getRecipe(t.mode).label} ·{" "}
                      {new Date(t.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1.5 truncate text-xs text-ink-muted">{t.body}</p>
                  </div>
                  {confirmDelete === t.id ? (
                    <span className="flex flex-none items-center gap-1">
                      <button
                        type="button"
                        className="btn-quiet btn-quiet-danger font-medium"
                        onClick={() => {
                          persist({
                            ...storage,
                            templates: storage.templates.filter((x) => x.id !== t.id),
                          });
                          setConfirmDelete(null);
                        }}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="btn-quiet"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn-quiet btn-quiet-danger flex-none"
                      aria-label={`Delete ${t.name}`}
                      onClick={() => setConfirmDelete(t.id)}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <PrivacyExplainer />
      </div>

      <footer className="mt-14 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline pt-6 text-xs text-ink-faint">
        <span>AskWise {version && `v${version}`}</span>
        <span aria-hidden>·</span>
        <span>
          Press <span className="kbd">Alt</span> <span className="kbd">I</span> to open the
          widget without reaching for the mouse
        </span>
        <a
          className="ml-auto inline-flex items-center gap-1 text-ink-muted underline decoration-hairline-strong underline-offset-2 hover:text-ink hover:decoration-ink"
          href="https://github.com/anish-ap2938/AskWise"
          target="_blank"
          rel="noreferrer"
        >
          Source
          <ExternalIcon />
        </a>
      </footer>
    </div>
  );
}
