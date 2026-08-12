import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SiteAdapter } from "../adapters/types";
import { InputWatcher } from "../inputWatcher";
import { improveTier1, type ImproveResult } from "../../shared/improve";
import type { ModeId, TargetModel } from "../../shared/types";
import { withAttachments, type Attachment } from "../../shared/attachment";
import { redactSecrets } from "../../shared/redact";
import { Pill } from "./Pill";
import { Popover } from "./Popover";
import { Toast } from "./Toast";
import type { AdvancedState } from "./VariantTabs";

type VariantKey = "simple" | "structured" | "advanced";

export interface WidgetSettings {
  defaultVariant: VariantKey;
  targetModelOverride: TargetModel | "auto";
}

export const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  defaultVariant: "structured",
  targetModelOverride: "auto",
};

interface WidgetAppProps {
  adapter: SiteAdapter;
  enabled: boolean;
  settings?: WidgetSettings;
}

const VIEWPORT_MARGIN = 8;
const TOAST_MS = 6000;
const TOAST_WITH_ACTION_MS = 12000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}

export function WidgetApp({
  adapter,
  enabled,
  settings = DEFAULT_WIDGET_SETTINGS,
}: WidgetAppProps) {
  const [composer, setComposer] = useState<HTMLElement | null>(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState<ImproveResult | null>(null);
  const [mode, setMode] = useState<ModeId>("quick_improve");
  const [pillVisible, setPillVisible] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeVariant, setActiveVariant] = useState<VariantKey>(
    settings.defaultVariant
  );
  const [scoreExpanded, setScoreExpanded] = useState(false);
  const [secretsExpanded, setSecretsExpanded] = useState(false);
  const [toast, setToast] = useState<{ message: string; action?: () => void; actionLabel?: string } | null>(null);
  const [copyOnly, setCopyOnly] = useState(false);
  const [advanced, setAdvanced] = useState<AdvancedState>({ status: "idle" });
  const [streamingText, setStreamingText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // User-filled placeholder edits; cleared whenever the result is regenerated.
  const [variantOverrides, setVariantOverrides] = useState<
    Partial<Record<VariantKey, string>>
  >({});
  const undoRef = useRef<string | null>(null);
  const textRef = useRef("");
  // Set when the user manually picks a mode; cleared on new text so we re-classify.
  const pinnedModeRef = useRef<ModeId | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const lastBoxRef = useRef({ top: -1, left: -1 });
  const [hostStyle, setHostStyle] = useState<React.CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 2147483646,
    pointerEvents: "none",
    visibility: "hidden",
  });

  const targetModel: TargetModel =
    settings.targetModelOverride === "auto"
      ? adapter.targetModel
      : settings.targetModelOverride;

  const refresh = useCallback(
    (raw: string, modeOverride?: ModeId) => {
      if (modeOverride) pinnedModeRef.current = modeOverride;
      const m = pinnedModeRef.current ?? undefined;
      const r = improveTier1(raw, targetModel, m);
      setResult(r);
      setMode(r.mode);
      setVariantOverrides({});
      setAdvanced({ status: "idle" });
      setStreamingText("");
      return r;
    },
    [targetModel]
  );

  const openPopover = useCallback(() => {
    if (!InputWatcher.shouldShowPill(textRef.current)) return;
    refresh(textRef.current);
    setPopoverOpen(true);
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;

    const watcher = new InputWatcher(
      adapter,
      (t, el) => {
        setText(t);
        textRef.current = t;
        setComposer(el);
        setPillVisible(InputWatcher.shouldShowPill(t));
        pinnedModeRef.current = null; // new text → re-classify
        if (InputWatcher.shouldShowPill(t)) refresh(t);
      },
      setComposer
    );
    watcher.start();
    return () => watcher.stop();
  }, [adapter, enabled, refresh]);

  // Keep the pill pinned to the composer. The composer moves on scroll, on
  // resize, and when the host page grows its own input, so a one-shot
  // measurement at typing time is not enough.
  const positionPill = useCallback(() => {
    const box = anchorRef.current;
    if (!composer || !box) return;

    const rect = composer.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const size = box.getBoundingClientRect();
    const width = size.width || 128;
    const height = size.height || 30;
    const anchor = adapter.anchor(composer);

    const rawTop =
      anchor.corner === "tr"
        ? rect.top + anchor.offsetY
        : rect.bottom - height - anchor.offsetY;
    const top = clamp(
      rawTop,
      VIEWPORT_MARGIN,
      window.innerHeight - height - VIEWPORT_MARGIN
    );
    const left = clamp(
      rect.right - width - anchor.offsetX,
      VIEWPORT_MARGIN,
      window.innerWidth - width - VIEWPORT_MARGIN
    );
    const offscreen = rect.bottom < 0 || rect.top > window.innerHeight;

    const last = lastBoxRef.current;
    if (Math.abs(last.top - top) < 0.5 && Math.abs(last.left - left) < 0.5) return;
    lastBoxRef.current = { top, left };

    setHostStyle({
      position: "fixed",
      top,
      left,
      zIndex: 2147483646,
      pointerEvents: "none",
      visibility: offscreen ? "hidden" : "visible",
    });
  }, [adapter, composer]);

  useLayoutEffect(() => {
    if (!pillVisible || !composer) return;

    positionPill();

    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        positionPill();
      });
    };

    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(composer);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
    // The pill's own width changes with the score, so re-measure on new results.
  }, [pillVisible, composer, positionPill, result?.scoreBefore.total]);

  useEffect(() => {
    const listener = (msg: { kind?: string }) => {
      if (msg?.kind === "COMMAND_OPEN") openPopover();
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [openPopover]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(
      () => setToast(null),
      toast.action ? TOAST_WITH_ACTION_MS : TOAST_MS
    );
    return () => clearTimeout(timer);
  }, [toast]);

  const effectiveVariant = (key: VariantKey): string =>
    variantOverrides[key] ?? result?.variants[key] ?? "";

  const handleReplace = () => {
    if (!composer || !result) return;
    const variantText = withAttachments(effectiveVariant(activeVariant), attachments);
    undoRef.current = text;
    const ok = adapter.writeText(composer, variantText);
    if (!ok) {
      setCopyOnly(true);
      void navigator.clipboard.writeText(variantText);
      setToast({
        message: "This site blocked the edit, so the prompt is on your clipboard.",
      });
    } else {
      setText(variantText);
      textRef.current = variantText;
      setToast({
        message: "Prompt replaced.",
        actionLabel: "Undo",
        action: () => {
          const original = undoRef.current;
          if (original !== null && composer) {
            adapter.writeText(composer, original);
            setText(original);
            textRef.current = original;
            undoRef.current = null;
          }
          setToast(null);
        },
      });
    }
    setPopoverOpen(false);
  };

  const handleCopy = async () => {
    if (!result) return;
    const variantText = withAttachments(effectiveVariant(activeVariant), attachments);
    try {
      await navigator.clipboard.writeText(variantText);
      setToast({ message: "Prompt copied." });
    } catch {
      // Clipboard API can fail in some host pages — fall back to a temporary textarea.
      const ta = document.createElement("textarea");
      ta.value = variantText;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setToast({ message: "Prompt copied." });
      } catch {
        setToast({ message: "Copying is blocked here — select the text and copy it manually." });
      }
      ta.remove();
    }
  };

  const handleSave = (name: string) => {
    if (!result) return;
    chrome.runtime.sendMessage({
      kind: "SAVE_TEMPLATE",
      payload: {
        id: crypto.randomUUID(),
        name,
        mode,
        body: effectiveVariant(activeVariant),
        createdAt: Date.now(),
        usageCount: 0,
      },
    });
    setToast({ message: `Saved “${name}” to your templates.` });
  };

  const handleRequestTier2 = () => {
    if (!result) return;
    setStreamingText("");
    setAdvanced({ status: "loading" });

    const rawWithContext = withAttachments(text, attachments);
    const redacted = redactSecrets(rawWithContext);
    const port = chrome.runtime.connect({ name: "tier2-stream" });
    let settled = false;

    port.postMessage({
      kind: "IMPROVE_REQUEST",
      payload: {
        raw: rawWithContext,
        redacted: redacted.redacted,
        redactions: redacted.map,
        mode,
        target: targetModel,
        wantTier2: true,
      },
    });

    port.onDisconnect.addListener(() => {
      if (settled) return;
      settled = true;
      setAdvanced({
        status: "error",
        message: "The on-device model stopped before it finished. Try again.",
      });
    });

    port.onMessage.addListener((msg: { kind: string; payload?: unknown }) => {
      if (msg.kind === "STREAM_CHUNK") {
        const p = msg.payload as { text: string };
        setStreamingText(p.text);
      }
      if (msg.kind === "IMPROVE_RESPONSE") {
        const p = msg.payload as {
          variants: ImproveResult["variants"];
          scoreAfter: ImproveResult["scoreAfter"];
          source: string;
        };
        setResult((prev) =>
          prev
            ? {
                ...prev,
                variants: p.variants,
                scoreAfter: p.scoreAfter,
              }
            : prev
        );
        setAdvanced({
          status: "ready",
          note:
            p.source === "llm"
              ? "Written by the model running on your device."
              : "The on-device model wasn't ready, so this is the built-in template.",
        });
        settled = true;
        port.disconnect();
      }
      if (msg.kind === "LLM_ERROR") {
        const p = msg.payload as { message: string };
        setAdvanced({ status: "error", message: p.message });
        settled = true;
        port.disconnect();
      }
    });
  };

  if (!enabled) return null;

  // Popover is a sibling of the fixed pill host so `position: fixed` is
  // viewport-relative (a fixed ancestor would become its containing block).
  return (
    <>
      <div style={hostStyle}>
        <div ref={anchorRef} style={{ position: "relative", pointerEvents: "auto" }}>
          <Pill
            score={result?.scoreBefore.total ?? 0}
            band={result?.scoreBefore.band ?? "weak"}
            visible={pillVisible}
            onClick={openPopover}
          />
          <Toast
            message={toast?.message ?? ""}
            actionLabel={toast?.actionLabel}
            onAction={toast?.action}
            onDismiss={() => setToast(null)}
            visible={!!toast}
          />
        </div>
      </div>
      <Popover
        open={popoverOpen}
        result={result}
        originalText={text}
        variantOverrides={variantOverrides}
        onVariantEdit={(variant, newText) =>
          setVariantOverrides((prev) => ({ ...prev, [variant]: newText }))
        }
        activeVariant={activeVariant}
        mode={mode}
        targetModel={targetModel}
        advanced={advanced}
        streamingText={streamingText}
        copyOnly={copyOnly}
        secretsExpanded={secretsExpanded}
        scoreExpanded={scoreExpanded}
        attachments={attachments}
        onAttachAdd={(a) => setAttachments((prev) => [...prev, a])}
        onAttachRemove={(id) =>
          setAttachments((prev) => prev.filter((a) => a.id !== id))
        }
        onAttachError={(message) => setToast({ message })}
        onClose={() => setPopoverOpen(false)}
        onVariantChange={setActiveVariant}
        onModeChange={(m) => refresh(text, m)}
        onReplace={handleReplace}
        onCopy={handleCopy}
        onSave={handleSave}
        onRequestTier2={handleRequestTier2}
        onToggleSecrets={() => setSecretsExpanded((v) => !v)}
        onToggleScore={() => setScoreExpanded((v) => !v)}
        onRefinePrompt={(prompt) => {
          // Refined text is the full prompt (may already include file context).
          setVariantOverrides((prev) => ({ ...prev, [activeVariant]: prompt }));
          setAttachments([]);
          setStreamingText("");
        }}
      />
    </>
  );
}
