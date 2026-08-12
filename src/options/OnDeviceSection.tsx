import { useCallback, useEffect, useState } from "react";
import type { StorageSchema } from "../shared/types";
import {
  ONDEVICE_MODELS,
  type OnDeviceModelId,
  type OnDeviceProgress,
} from "../shared/ondeviceModel";
import { DownloadIcon, ProgressBar, Section, StatusPill, type StatusTone } from "./ui";

interface Props {
  storage: StorageSchema;
  onPersist: (next: StorageSchema) => void;
}

const STATUS_COPY: Record<
  OnDeviceProgress["status"],
  { tone: StatusTone; label: string; detail: string }
> = {
  idle: {
    tone: "neutral",
    label: "Not downloaded",
    detail:
      "Simple and Structured rewrites already work. Download the model when you want Advanced and Refine.",
  },
  downloading: {
    tone: "working",
    label: "Downloading",
    detail:
      "You can keep browsing. The download resumes if you close the tab, and it only happens once per model.",
  },
  ready: {
    tone: "ready",
    label: "Ready",
    detail: "Advanced rewrites and Refine now run on this device.",
  },
  error: {
    tone: "error",
    label: "Download failed",
    detail: "Usually a dropped connection or a full disk. Try again below.",
  },
  unsupported: {
    tone: "warn",
    label: "Not supported here",
    detail:
      "Advanced and Refine need WebGPU (Chrome 113 or newer, with hardware acceleration on). Simple and Structured are unaffected.",
  },
};

export function OnDeviceSection({ storage, onPersist }: Props) {
  const [progress, setProgress] = useState<OnDeviceProgress | null>(null);

  const refresh = useCallback(() => {
    chrome.runtime.sendMessage({ kind: "GET_ONDEVICE_STATUS" }, (response) => {
      if (response?.kind === "ONDEVICE_STATUS") {
        setProgress(response.payload as OnDeviceProgress);
      }
    });
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 1500);
    const onStorage = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area === "local" && changes.askwise_ondevice_progress) {
        setProgress(changes.askwise_ondevice_progress.newValue as OnDeviceProgress);
      }
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => {
      window.clearInterval(id);
      chrome.storage.onChanged.removeListener(onStorage);
    };
  }, [refresh]);

  const download = () => {
    chrome.runtime.sendMessage(
      {
        kind: "ENSURE_ONDEVICE",
        payload: { model: storage.providers.ondevice.model },
      },
      (response) => {
        if (response?.kind === "ONDEVICE_STATUS") {
          setProgress(response.payload as OnDeviceProgress);
        }
      }
    );
  };

  const status = progress?.status ?? "idle";
  const copy = STATUS_COPY[status];
  const selected =
    ONDEVICE_MODELS.find((m) => m.id === storage.providers.ondevice.model) ??
    ONDEVICE_MODELS[0];
  const pct = Math.round((progress?.progress ?? 0) * 100);
  const downloading = status === "downloading";

  return (
    <Section
      title="Advanced rewrites"
      description={
        <>
          Simple and Structured are template rewrites — instant, offline, no download.
          Advanced and Refine are written by a language model that runs inside your
          browser, so the model file has to be fetched once ({selected.approxSizeGb} GB)
          and is then cached.
        </>
      }
    >
      <div className="card divide-y divide-hairline">
        <label className="block px-4 py-4">
          <span className="field-label">Model</span>
          <select
            className="control mt-2"
            value={storage.providers.ondevice.model}
            onChange={(e) =>
              onPersist({
                ...storage,
                providers: {
                  ...storage.providers,
                  ondevice: {
                    ...storage.providers.ondevice,
                    model: e.target.value as OnDeviceModelId,
                  },
                },
              })
            }
          >
            {ONDEVICE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} — {m.approxSizeGb} GB
              </option>
            ))}
          </select>
          <span className="field-hint">{selected.description}</span>
        </label>

        <div className="space-y-3 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <StatusPill tone={copy.tone}>
              {copy.label}
              {downloading && ` · ${pct}%`}
            </StatusPill>
            {status !== "unsupported" && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={download}
                disabled={downloading}
              >
                <DownloadIcon />
                {status === "ready" ? "Re-download" : downloading ? "Downloading…" : "Download"}
              </button>
            )}
          </div>

          {(downloading || status === "ready") && (
            <ProgressBar
              value={progress?.progress ?? 0}
              tone={status === "ready" ? "positive" : "neutral"}
              label={`${selected.label} download`}
            />
          )}

          <p className="text-xs text-ink-muted">{copy.detail}</p>

          {progress?.error && (
            <p className="rounded-md bg-critical-soft px-3 py-2 text-xs text-critical">
              {progress.error}
            </p>
          )}
          {downloading && progress?.text && (
            <p className="break-words text-xs text-ink-faint">{progress.text}</p>
          )}
        </div>
      </div>
    </Section>
  );
}
