import { useEffect, useMemo, useState } from "react";
import { improveTier1 } from "../shared/improve";
import { getRecipe } from "../shared/recipes";
import type { ScoreResult } from "../shared/types";
import {
  DEFAULT_ONDEVICE_PROGRESS,
  ONDEVICE_MODELS,
  type OnDeviceProgress,
} from "../shared/ondeviceModel";
import {
  humanizeOnDeviceError,
  ONDEVICE_PROGRESS_KEY,
} from "../shared/ondeviceProgress";
import { connectKeepAlivePort, sendToBackground } from "../shared/runtimeMessage";
import { DownloadIcon, ExternalIcon, ProgressBar, StatusPill, type StatusTone } from "../options/ui";

const DEMO_PROMPT = "i want to build and app for fitness";

const EXAMPLES = [
  DEMO_PROMPT,
  "how do i make my resume pass ats screening",
  "write an email to my boss asking for a raise",
  "my page is slow and takes 8 seconds to load",
];

const SITES = ["ChatGPT", "Claude", "Gemini", "Perplexity", "DeepSeek", "Copilot"];

const STEPS = [
  {
    title: "Pin AskWise",
    body: "Chrome hides new extensions behind the puzzle-piece icon. Pin it and the settings are one click away.",
  },
  {
    title: "Open a chat and start typing",
    body: "Past about eight characters, an Improve button appears in the corner of the composer with the current score of what you've written.",
  },
  {
    title: "Pick a version, then Replace",
    body: "Simple tightens what you wrote. Structured adds the sections a model actually uses. Replace swaps it into the composer, and Undo puts your original back.",
  },
];

const BAND_TEXT: Record<ScoreResult["band"], string> = {
  weak: "text-critical",
  okay: "text-accent-ink",
  strong: "text-positive",
};

const MODEL_STATUS: Record<OnDeviceProgress["status"], { tone: StatusTone; title: string }> = {
  idle: { tone: "neutral", title: "Advanced rewrites need a one-time download" },
  downloading: { tone: "working", title: "Downloading the Advanced model" },
  ready: { tone: "ready", title: "Advanced rewrites are ready" },
  error: { tone: "error", title: "The model download didn't finish" },
  unsupported: { tone: "warn", title: "Advanced rewrites aren't available in this browser" },
};

type ModelInfo = (typeof ONDEVICE_MODELS)[number];

const PILL_LABEL: Record<
  OnDeviceProgress["status"],
  (model: ModelInfo, progress: OnDeviceProgress | null) => string
> = {
  idle: (model) => `${model.approxSizeGb} GB`,
  downloading: (_model, progress) => `${Math.round((progress?.progress ?? 0) * 100)}%`,
  ready: () => "Ready",
  error: () => "Stopped",
  unsupported: () => "Unavailable",
};

function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-[-0.01em]">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden
        focusable="false"
        className="text-accent"
      >
        <path d="M9.1 1.4 3.3 8.7a.5.5 0 0 0 .39.81H7l-.9 4.9a.3.3 0 0 0 .53.24l5.8-7.3a.5.5 0 0 0-.39-.81H9l.63-4.15a.3.3 0 0 0-.53-.24Z" />
      </svg>
      AskWise
    </span>
  );
}

export function Onboarding() {
  const [text, setText] = useState(DEMO_PROMPT);
  const [ondevice, setOndevice] = useState<OnDeviceProgress | null>(null);

  useEffect(() => {
    const disconnect = connectKeepAlivePort();
    const refresh = () => {
      void sendToBackground<{ kind?: string; payload?: OnDeviceProgress }>(
        { kind: "GET_ONDEVICE_STATUS" },
        { retries: 2, retryDelayMs: 200 }
      )
        .then((response) => {
          if (response?.kind === "ONDEVICE_STATUS" && response.payload) {
            setOndevice(response.payload);
          }
        })
        .catch(() => {
          // Storage events still drive the UI if the worker is waking up.
        });
    };
    refresh();
    const id = window.setInterval(refresh, 1200);
    const onStorage = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area === "local" && changes[ONDEVICE_PROGRESS_KEY]) {
        setOndevice(changes[ONDEVICE_PROGRESS_KEY].newValue as OnDeviceProgress);
      }
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => {
      disconnect();
      window.clearInterval(id);
      chrome.storage.onChanged.removeListener(onStorage);
    };
  }, []);

  const result = useMemo(() => {
    const trimmed = text.trim();
    if (trimmed.split(/\s+/).filter(Boolean).length < 3) return null;
    try {
      return improveTier1(trimmed, "chatgpt");
    } catch {
      return null;
    }
  }, [text]);

  const status = ondevice?.status ?? "idle";
  const model =
    ONDEVICE_MODELS.find((m) => m.id === ondevice?.model) ?? ONDEVICE_MODELS[0];
  const modelStatus = MODEL_STATUS[status];

  return (
    <div className="mx-auto max-w-[920px] px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <Wordmark />
        <button
          type="button"
          className="btn-quiet"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Settings
        </button>
      </div>

      <header className="mt-10 max-w-prose">
        <h1 className="text-3xl font-semibold tracking-[-0.025em]">AskWise is installed.</h1>
        <p className="mt-3 text-lg text-ink-muted">
          It puts an Improve button in the composer on {SITES.slice(0, -1).join(", ")}, and{" "}
          {SITES.at(-1)}. Click it and you get your prompt rewritten into the shape those
          models answer well — scored, so you can see what was missing.
        </p>
        <p className="mt-3 text-sm text-ink-faint">
          Free, no account, and the rewriting happens on your machine.
        </p>
      </header>

      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h2 className="text-lg font-semibold tracking-[-0.01em]">Try it here first</h2>
          <p className="text-sm text-ink-faint">
            This is the same rewrite engine the widget uses, running locally right now.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => {
            const active = ex === text;
            return (
              <button
                key={ex}
                type="button"
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  active
                    ? "border-transparent bg-accent-soft text-accent-ink"
                    : "border-hairline-strong text-ink-muted hover:bg-sunken hover:text-ink"
                }`}
                onClick={() => setText(ex)}
              >
                {ex.length > 40 ? `${ex.slice(0, 40)}…` : ex}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card flex flex-col p-4">
            <label
              className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint"
              htmlFor="demo-input"
            >
              What you type
            </label>
            <textarea
              id="demo-input"
              className="mt-3 min-h-[96px] flex-1 resize-y rounded-md border border-hairline-strong bg-surface p-3 text-sm text-ink placeholder:text-ink-faint"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type the way you actually type — typos included."
            />
            {result && (
              <div className="mt-3">
                <p className="flex items-baseline gap-1.5 text-sm text-ink-muted">
                  <span
                    className={`text-xl font-semibold ${BAND_TEXT[result.scoreBefore.band]}`}
                  >
                    {result.scoreBefore.total}
                  </span>
                  <span>/ 100</span>
                </p>
                {result.scoreBefore.missing.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {result.scoreBefore.missing.slice(0, 3).map((m) => (
                      <li key={m} className="flex gap-2 text-xs text-ink-muted">
                        <span
                          aria-hidden
                          className="mt-[7px] h-1 w-1 flex-none rounded-full bg-critical"
                        />
                        {m}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-ink-faint">
                    Nothing obvious missing — the rewrite will mostly tidy the phrasing.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="card flex flex-col bg-sunken p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">
                What AskWise sends
              </span>
              {result && (
                <span className="tag">
                  {getRecipe(result.mode).label}
                  {result.subRecipe ? ` · ${result.subRecipe.label}` : ""}
                </span>
              )}
            </div>

            {result ? (
              <>
                <p className="mt-3 flex items-baseline gap-2 text-sm text-ink-muted">
                  <span className={`text-xl font-semibold ${BAND_TEXT[result.scoreAfter.band]}`}>
                    {result.scoreAfter.total}
                  </span>
                  <span>/ 100</span>
                  {result.scoreAfter.total > result.scoreBefore.total && (
                    <span className="text-positive">
                      +{result.scoreAfter.total - result.scoreBefore.total}
                    </span>
                  )}
                </p>
                <pre className="mt-3 max-h-72 flex-1 overflow-y-auto whitespace-pre-wrap rounded-md border border-hairline bg-surface p-3 text-xs leading-relaxed text-ink">
                  {result.variants.structured}
                </pre>
              </>
            ) : (
              <p className="mt-3 flex-1 text-sm text-ink-faint">
                Write at least three words on the left and the structured rewrite shows up
                here.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">Then, on any chat site</h2>
        <ol className="mt-4 divide-y divide-hairline border-y border-hairline">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4 py-4">
              <span className="mt-0.5 flex-none text-sm font-medium tabular-nums text-ink-faint">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-medium">{step.title}</h3>
                <p className="mt-1 max-w-prose text-sm text-ink-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card mt-14 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">{modelStatus.title}</h2>
              <StatusPill tone={modelStatus.tone}>{PILL_LABEL[status](model, ondevice)}</StatusPill>
            </div>
            <p className="mt-2 max-w-prose text-sm text-ink-muted">
              Simple and Structured rewrites are templates and work offline from the start.
              The Advanced tab and Refine chat use a language model that runs in your
              browser, which means downloading {model.approxSizeGb} GB once. Nothing you
              type is uploaded to run it.
            </p>
          </div>

          {(status === "idle" || status === "error") && (
            <button
              type="button"
              className="btn btn-primary flex-none"
              onClick={() => {
                void sendToBackground<{ kind?: string; payload?: OnDeviceProgress }>({
                  kind: "ENSURE_ONDEVICE",
                })
                  .then((response) => {
                    if (response?.kind === "ONDEVICE_STATUS" && response.payload) {
                      setOndevice(response.payload);
                    }
                  })
                  .catch((err: unknown) => {
                    const message = err instanceof Error ? err.message : String(err);
                    setOndevice((prev) => ({
                      ...(prev ?? DEFAULT_ONDEVICE_PROGRESS),
                      status: "error",
                      text: "Download stopped",
                      error: humanizeOnDeviceError(message),
                      updatedAt: Date.now(),
                    }));
                  });
              }}
            >
              <DownloadIcon />
              {status === "error" ? "Try again" : "Download now"}
            </button>
          )}
        </div>

        {status === "downloading" && (
          <div className="mt-4 space-y-2">
            <ProgressBar
              value={ondevice?.progress ?? 0}
              label={`${model.label} download`}
            />
            <p className="text-xs text-ink-faint">
              {ondevice?.text || "Starting…"} — you can close this tab, it keeps going.
            </p>
          </div>
        )}

        {status === "error" && ondevice?.error && (
          <p className="mt-4 rounded-md bg-critical-soft px-3 py-2 text-xs text-critical">
            {humanizeOnDeviceError(ondevice.error)}
          </p>
        )}
      </section>

      <footer className="mt-14 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-hairline pt-6 text-xs text-ink-faint">
        <span>
          Shortcut: <span className="kbd">Alt</span> <span className="kbd">I</span>
        </span>
        <button
          type="button"
          className="text-ink-muted underline decoration-hairline-strong underline-offset-2 hover:text-ink hover:decoration-ink"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Settings
        </button>
        <a
          className="inline-flex items-center gap-1 text-ink-muted underline decoration-hairline-strong underline-offset-2 hover:text-ink hover:decoration-ink"
          href="https://askwise-privacy.vercel.app/privacy-policy"
          target="_blank"
          rel="noreferrer"
        >
          Privacy policy
          <ExternalIcon />
        </a>
        <a
          className="inline-flex items-center gap-1 text-ink-muted underline decoration-hairline-strong underline-offset-2 hover:text-ink hover:decoration-ink"
          href="https://github.com/anish-ap2938/AskWise"
          target="_blank"
          rel="noreferrer"
        >
          Source, MIT
          <ExternalIcon />
        </a>
      </footer>
    </div>
  );
}
