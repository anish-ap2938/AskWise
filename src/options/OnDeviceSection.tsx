import { useCallback, useEffect, useState } from "react";
import type { StorageSchema } from "../shared/types";
import {
  ONDEVICE_MODELS,
  type OnDeviceModelId,
  type OnDeviceProgress,
} from "../shared/ondeviceModel";

interface Props {
  storage: StorageSchema;
  onPersist: (next: StorageSchema) => void;
}

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

  const pct = Math.round((progress?.progress ?? 0) * 100);
  const status = progress?.status ?? "idle";

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">On-device AI (automatic)</h2>
      <p className="text-sm text-gray-600">
        A small instruct model (~1 GB) downloads into your browser on install and runs
        privately via WebGPU. Your Tier 1 templates and rewrite prompts stay the same —
        this only powers Advanced when no Ollama server is available.
      </p>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={storage.providers.ondevice.enabled}
          onChange={(e) =>
            onPersist({
              ...storage,
              providers: {
                ...storage.providers,
                ondevice: {
                  ...storage.providers.ondevice,
                  enabled: e.target.checked,
                },
              },
            })
          }
        />
        <span>Enable built-in on-device model</span>
      </label>

      <label className="block">
        <span className="text-sm text-gray-600">Model</span>
        <select
          className="mt-1 block w-full rounded border px-3 py-2"
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
              {m.label} (~{m.approxSizeGb} GB)
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium capitalize">{status.replace("_", " ")}</span>
          <span className="text-gray-500">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-violet-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {progress?.text && (
          <p className="text-xs text-gray-600 break-words">{progress.text}</p>
        )}
        {status === "unsupported" && (
          <p className="text-xs text-amber-700">
            Needs Chrome 109+ with WebGPU. Firefox users can use Ollama below instead.
          </p>
        )}
      </div>

      <button
        type="button"
        className="rounded bg-violet-600 px-4 py-2 text-white text-sm disabled:opacity-50"
        onClick={download}
        disabled={status === "downloading"}
      >
        {status === "ready" ? "Reload model" : "Download / resume model"}
      </button>
    </section>
  );
}
