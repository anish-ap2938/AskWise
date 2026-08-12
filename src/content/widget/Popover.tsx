import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ImproveResult } from "../../shared/improve";
import type { ModeId, TargetModel, VariantSet } from "../../shared/types";
import type { Attachment } from "../../shared/attachment";
import { ModeChip, VariantTabs, type AdvancedState } from "./VariantTabs";
import { ScoreRow } from "./ScoreRow";
import { SecretsChip } from "./SecretsChip";
import { withAttachments } from "../../shared/attachment";
import { AttachBar } from "./AttachBar";
import { computePopoverPosition } from "./utils";
import { BookmarkIcon, CloseIcon, CopyIcon } from "./Icons";

type VariantKey = "simple" | "structured" | "advanced";

const HIDDEN_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  visibility: "hidden",
  zIndex: 2147483647,
};

const FOCUSABLE =
  'button, select, input, textarea, a[href], [tabindex]:not([tabindex="-1"])';

interface PopoverProps {
  open: boolean;
  result: ImproveResult | null;
  originalText: string;
  variantOverrides: Partial<Record<VariantKey, string>>;
  onVariantEdit: (variant: VariantKey, newText: string) => void;
  activeVariant: VariantKey;
  mode: ModeId;
  targetModel: TargetModel;
  advanced: AdvancedState;
  streamingText?: string;
  copyOnly?: boolean;
  secretsExpanded: boolean;
  scoreExpanded: boolean;
  attachments: Attachment[];
  onAttachAdd: (attachment: Attachment) => void;
  onAttachRemove: (id: string) => void;
  onAttachError: (message: string) => void;
  onClose: () => void;
  onVariantChange: (v: VariantKey) => void;
  onModeChange: (m: ModeId) => void;
  onReplace: () => void;
  onCopy: () => void;
  onSave: (name: string) => void;
  onRequestTier2: () => void;
  onToggleSecrets: () => void;
  onToggleScore: () => void;
  onRefinePrompt: (prompt: string) => void;
}

export function Popover({
  open,
  result,
  originalText,
  variantOverrides,
  onVariantEdit,
  activeVariant,
  mode,
  advanced,
  streamingText,
  copyOnly,
  secretsExpanded,
  scoreExpanded,
  attachments,
  onAttachAdd,
  onAttachRemove,
  onAttachError,
  onClose,
  onVariantChange,
  onModeChange,
  onReplace,
  onCopy,
  onSave,
  onRequestTier2,
  onToggleSecrets,
  onToggleScore,
  onRefinePrompt,
}: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [positionStyle, setPositionStyle] =
    useState<React.CSSProperties>(HIDDEN_STYLE);
  const [ready, setReady] = useState(false);
  const [savingName, setSavingName] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPositionStyle(HIDDEN_STYLE);
      setReady(false);
      return;
    }

    const reposition = () => {
      const pop = ref.current;
      if (!pop) return;

      const root = pop.getRootNode();
      const pillEl =
        root instanceof ShadowRoot
          ? root.querySelector(".aw-pill")
          : document.querySelector(".aw-pill");
      const pillRect = pillEl?.getBoundingClientRect();
      if (!pillRect) return;

      const naturalHeight = Math.max(pop.scrollHeight, 280);
      const naturalWidth = Math.max(pop.offsetWidth, 280);

      const { top, left, maxHeight } = computePopoverPosition(
        pillRect,
        naturalWidth,
        naturalHeight
      );

      setPositionStyle({
        position: "fixed",
        top,
        left,
        right: "auto",
        bottom: "auto",
        margin: 0,
        maxHeight: `${maxHeight}px`,
        height: "auto",
        visibility: "visible",
        zIndex: 2147483647,
        pointerEvents: "auto",
      });
      setReady(true);
    };

    reposition();
    const raf = requestAnimationFrame(() => {
      reposition();
      requestAnimationFrame(reposition);
    });
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [
    open,
    result,
    activeVariant,
    scoreExpanded,
    secretsExpanded,
    streamingText,
    advanced,
    savingName !== null,
    attachments.length,
  ]);

  // Move focus into the dialog on open and hand it back on close. Without this
  // the widget is unreachable by keyboard: the shadow host is appended at the
  // very end of the page, so Tab would have to cross the whole host site first.
  useEffect(() => {
    if (!open) return;
    const root = ref.current?.getRootNode();
    const previous =
      root instanceof ShadowRoot
        ? (root.activeElement as HTMLElement | null)
        : null;
    ref.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // Shadow DOM retargets e.target to the host, so contains() always fails for
    // clicks inside the popover. Use composedPath() to see the real targets.
    const onPointerDown = (e: Event) => {
      const path = e.composedPath();
      if (ref.current && path.includes(ref.current)) return;
      // Keep open when clicking the Improve pill (sibling of this popover).
      const host = (e.target as Node | null)?.getRootNode?.();
      if (host instanceof ShadowRoot && host.contains(ref.current)) {
        const pill = host.querySelector(".aw-pill");
        if (pill && path.includes(pill)) return;
      }
      onClose();
    };

    document.addEventListener("keydown", onKey);
    // Delay so the opening click doesn't immediately close.
    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown, true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open, onClose]);

  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !ref.current) return;
    const nodes = Array.from(
      ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)
    ).filter((el) => el.tabIndex >= 0 && !el.hasAttribute("disabled"));
    if (nodes.length === 0) return;

    const root = ref.current.getRootNode();
    const current =
      root instanceof ShadowRoot
        ? (root.activeElement as HTMLElement | null)
        : null;
    const index = current ? nodes.indexOf(current) : -1;

    let next = e.shiftKey ? index - 1 : index + 1;
    if (index === -1) next = e.shiftKey ? nodes.length - 1 : 0;
    if (next < 0) next = nodes.length - 1;
    if (next >= nodes.length) next = 0;

    e.preventDefault();
    nodes[next]?.focus();
  };

  if (!open || !result) return null;

  const variants: VariantSet = { ...result.variants, ...variantOverrides };
  const baseActive =
    activeVariant === "advanced" && streamingText
      ? streamingText
      : variants[activeVariant];
  const displayText = withAttachments(baseActive, attachments);

  const commitSave = () => {
    const name = savingName?.trim();
    if (name) onSave(name);
    setSavingName(null);
  };

  return (
    <div
      ref={ref}
      className="aw-popover"
      role="dialog"
      aria-label="AskWise prompt improver"
      tabIndex={-1}
      data-ready={ready ? "true" : "false"}
      style={positionStyle}
      onKeyDown={trapTab}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="aw-row aw-header">
        <span className="aw-header-left">
          <ModeChip mode={mode} onChange={onModeChange} />
          {result.subRecipe && (
            <span className="aw-chip" title={result.subRecipe.label}>
              {result.subRecipe.label}
            </span>
          )}
        </span>
        <button
          type="button"
          className="aw-icon-btn"
          aria-label="Close AskWise"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="aw-scroll">
        <ScoreRow
          before={result.scoreBefore}
          after={result.scoreAfter}
          expanded={scoreExpanded}
          onToggle={onToggleScore}
        />

        <SecretsChip
          matches={result.redaction.matches}
          expanded={secretsExpanded}
          onToggle={onToggleSecrets}
        />

        <VariantTabs
          active={activeVariant}
          variants={variants}
          attachments={attachments}
          displayText={displayText}
          original={originalText}
          advanced={advanced}
          streamingText={streamingText}
          onChange={(v) => {
            onVariantChange(v);
            if (v === "advanced" && advanced.status === "idle") onRequestTier2();
          }}
          onEdit={onVariantEdit}
          onRefinePrompt={onRefinePrompt}
          onRetryAdvanced={onRequestTier2}
        />

        <AttachBar
          attachments={attachments}
          onAdd={onAttachAdd}
          onRemove={onAttachRemove}
          onError={onAttachError}
        />
      </div>

      {savingName === null ? (
        <div className="aw-row aw-footer">
          {!copyOnly && (
            <button
              type="button"
              className="aw-btn aw-btn-primary"
              title="Put this prompt in the chat box"
              aria-label="Replace the text in the chat box with this prompt"
              onClick={onReplace}
            >
              Replace
            </button>
          )}
          <button
            type="button"
            className="aw-btn aw-btn-secondary"
            onClick={onCopy}
          >
            <CopyIcon />
            Copy
          </button>
          <button
            type="button"
            className="aw-btn aw-btn-secondary"
            title="Save this prompt as a reusable template"
            onClick={() => setSavingName("")}
          >
            <BookmarkIcon />
            Save
          </button>
        </div>
      ) : (
        <div className="aw-row aw-footer">
          <input
            autoFocus
            className="aw-input"
            aria-label="Template name"
            placeholder="Name this template…"
            value={savingName}
            onChange={(e) => setSavingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitSave();
              if (e.key === "Escape") setSavingName(null);
            }}
          />
          <button
            type="button"
            className="aw-btn aw-btn-secondary aw-btn-sm"
            onClick={() => setSavingName(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="aw-btn aw-btn-primary aw-btn-sm"
            style={{ flex: "none" }}
            disabled={!savingName.trim()}
            onClick={commitSave}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
