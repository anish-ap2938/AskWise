import { useEffect, useMemo, useState } from "react";
import { improveTier1 } from "../shared/improve";
import { getRecipe } from "../shared/recipes";
import type { OnDeviceProgress } from "../shared/ondeviceModel";

const DEMO_PROMPT = "i want to build and app for fitness";

const EXAMPLES = [
  DEMO_PROMPT,
  "how do i make my resume pass ats screening",
  "write an email to my boss asking for a raise",
  "my page is slow and takes 8 seconds to load",
];

export function Onboarding() {
  const [text, setText] = useState(DEMO_PROMPT);
  const [ondevice, setOndevice] = useState<OnDeviceProgress | null>(null);

  useEffect(() => {
    const refresh = () => {
      chrome.runtime.sendMessage({ kind: "GET_ONDEVICE_STATUS" }, (response) => {
        if (response?.kind === "ONDEVICE_STATUS") {
          setOndevice(response.payload as OnDeviceProgress);
        }
      });
    };
    refresh();
    // Kick download if install listener hasn't finished yet.
    chrome.runtime.sendMessage({ kind: "ENSURE_ONDEVICE" });
    const id = window.setInterval(refresh, 1200);
    const onStorage = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area === "local" && changes.askwise_ondevice_progress) {
        setOndevice(changes.askwise_ondevice_progress.newValue as OnDeviceProgress);
      }
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => {
      window.clearInterval(id);
      chrome.storage.onChanged.removeListener(onStorage);
    };
  }, []);

  const result = useMemo(() => {
    const trimmed = text.trim();
    if (trimmed.split(/\s+/).length < 3) return null;
    try {
      return improveTier1(trimmed, "chatgpt");
    } catch {
      return null;
    }
  }, [text]);

  return (
    <div className="mx-auto max-w-3xl space-y-10 p-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          <span className="text-violet-600">⚡ AskWise</span> is ready
        </h1>
        <p className="text-gray-600">
          Grammarly for AI prompts — free, open source, and everything runs on your device.
        </p>
      </header>

      <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-6">
        <h2 className="mb-1 text-lg font-semibold">Try it right now</h2>
        <p className="mb-3 text-sm text-gray-600">
          Type a rough prompt (or click an example) and watch it transform — this is exactly
          what happens on ChatGPT, Claude, Gemini, Perplexity, DeepSeek, and Copilot.
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="rounded-full border border-violet-300 bg-white px-3 py-1 text-xs text-violet-700 hover:bg-violet-100"
              onClick={() => setText(ex)}
            >
              {ex.length > 42 ? ex.slice(0, 42) + "…" : ex}
            </button>
          ))}
        </div>
        <textarea
          className="h-20 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-violet-500 focus:outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a rough prompt here…"
        />

        {result && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-red-600">{result.scoreBefore.total}</span>
              <span className="text-lg text-gray-400">→</span>
              <span className="text-2xl font-bold text-green-600">{result.scoreAfter.total}</span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                {getRecipe(result.mode).label}
                {result.subRecipe ? ` · ${result.subRecipe.label}` : ""}
              </span>
            </div>
            <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-xs leading-relaxed">
              {result.variants.structured}
            </pre>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            step: "1",
            title: "Pin the extension",
            body: "Click the puzzle icon in Chrome's toolbar and pin AskWise so it's always a click away.",
          },
          {
            step: "2",
            title: "Open your AI chat",
            body: "Go to ChatGPT, Claude, Gemini, Perplexity, DeepSeek, or Copilot and start typing a prompt (8+ words).",
          },
          {
            step: "3",
            title: "Click ⚡ Improve",
            body: "The pill appears near the composer. Pick Simple, Structured, or Advanced and hit Replace.",
          },
        ].map((s) => (
          <div key={s.step} className="rounded-xl border border-gray-200 p-4">
            <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
              {s.step}
            </div>
            <h3 className="mb-1 text-sm font-semibold">{s.title}</h3>
            <p className="text-xs text-gray-600">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-violet-200 bg-violet-50/40 p-5 space-y-3">
        <h2 className="text-base font-semibold">Downloading on-device AI…</h2>
        <p className="text-sm text-gray-600">
          A ~1.9 GB private model is downloading into your browser for Advanced rewrites.
          Instant Simple/Structured rewrites already work — no wait needed.
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full bg-violet-600 transition-all"
            style={{ width: `${Math.round((ondevice?.progress ?? 0) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-600">
          {ondevice?.status === "ready"
            ? "Model ready — Advanced rewrites will run on your PC."
            : ondevice?.text || "Starting download…"}
        </p>
        <button
          type="button"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Model settings
        </button>
      </section>

      <footer className="text-center text-xs text-gray-400">
        No account. No tracking. No data leaves your device. MIT-licensed open source.
      </footer>
    </div>
  );
}
