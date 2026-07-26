import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteAdapter } from "../adapters/types";
import { InputWatcher } from "../inputWatcher";
import { improveTier1, type ImproveResult } from "../../shared/improve";
import type { ModeId } from "../../shared/types";
import { withAttachments, type Attachment } from "../../shared/attachment";
import { redactSecrets } from "../../shared/redact";
import { Pill } from "./Pill";
import { Popover } from "./Popover";
import { Toast } from "./Toast";

type VariantKey = "simple" | "structured" | "advanced";

interface WidgetAppProps {
  adapter: SiteAdapter;
  enabled: boolean;
}

export function WidgetApp({ adapter, enabled }: WidgetAppProps) {
  const [composer, setComposer] = useState<HTMLElement | null>(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState<ImproveResult | null>(null);
  const [mode, setMode] = useState<ModeId>("quick_improve");
  const [pillVisible, setPillVisible] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeVariant, setActiveVariant] = useState<VariantKey>("structured");
  const [scoreExpanded, setScoreExpanded] = useState(false);
  const [secretsExpanded, setSecretsExpanded] = useState(false);
  const [toast, setToast] = useState<{ message: string; action?: () => void; actionLabel?: string } | null>(null);
  const [copyOnly, setCopyOnly] = useState(false);
  const [tier2Note, setTier2Note] = useState("");
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
  const [hostStyle, setHostStyle] = useState<React.CSSProperties>({});

  const targetModel = adapter.targetModel;

  const refresh = useCallback(
    (raw: string, modeOverride?: ModeId) => {
      if (modeOverride) pinnedModeRef.current = modeOverride;
      const m = pinnedModeRef.current ?? undefined;
      const r = improveTier1(raw, targetModel, m);
      setResult(r);
      setMode(r.mode);
      setVariantOverrides({});
      return r;
    },
    [targetModel]
  );

  const openPopover = useCallback(() => {
    if (!InputWatcher.shouldShowPill(text)) return;
    refresh(text);
    setPopoverOpen(true);
  }, [text, refresh]);

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
        const rect = el.getBoundingClientRect();
        const anchor = adapter.anchor(el);
        const top = Math.max(8, Math.min(window.innerHeight - 48, rect.bottom - 44 - anchor.offsetY));
        const left = Math.max(8, Math.min(window.innerWidth - 160, rect.right - 150 - anchor.offsetX));
        setHostStyle({
          position: "fixed",
          top,
          left,
          zIndex: 2147483646,
          pointerEvents: "none",
        });
      },
      setComposer
    );
    watcher.start();
    return () => watcher.stop();
  }, [adapter, enabled, refresh]);

  useEffect(() => {
    const listener = (msg: { kind?: string }) => {
      if (msg?.kind === "COMMAND_OPEN") openPopover();
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [openPopover]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 10000);
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
      setToast({ message: "Couldn't insert automatically — copied to clipboard." });
    } else {
      setText(variantText);
      setToast({
        message: "Prompt replaced.",
        actionLabel: "Undo",
        action: () => {
          const original = undoRef.current;
          if (original !== null && composer) {
            adapter.writeText(composer, original);
            setText(original);
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
      setToast({ message: "Copied to clipboard." });
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
        setToast({ message: "Copied to clipboard." });
      } catch {
        setToast({ message: "Couldn't copy — select the text and copy manually." });
      }
      ta.remove();
    }
  };

  const handleSave = () => {
    if (!result) return;
    const name = prompt("Template name:", `${mode} template`);
    if (!name) return;
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
    setToast({ message: "Template saved." });
  };

  const handleRequestTier2 = () => {
    if (!result) return;
    setStreamingText("");
    setTier2Note("Generating with the on-device model…");
    const rawWithContext = withAttachments(text, attachments);
    const redacted = redactSecrets(rawWithContext);
    const port = chrome.runtime.connect({ name: "tier2-stream" });
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
        setTier2Note(
          p.source === "llm" ? "Generated privately by the on-device model." : ""
        );
        port.disconnect();
      }
      if (msg.kind === "LLM_ERROR") {
        const p = msg.payload as { message: string };
        setTier2Note(p.message);
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
        <div style={{ position: "relative", pointerEvents: "auto" }}>
          <Pill
            score={result?.scoreBefore.total ?? 0}
            visible={pillVisible}
            onClick={openPopover}
          />
          <Toast
            message={toast?.message ?? ""}
            actionLabel={toast?.actionLabel}
            onAction={toast?.action}
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
        tier2Note={tier2Note}
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
