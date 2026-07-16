import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ImproveResult } from "../../shared/improve";
import type { ModeId, TargetModel, VariantSet } from "../../shared/types";
import type { Attachment } from "../../shared/attachment";
import { ModeChip, VariantTabs } from "./VariantTabs";
import { ScoreRow } from "./ScoreRow";
import { SecretsChip } from "./SecretsChip";
import { withAttachments } from "../../shared/attachment";
import { AttachBar } from "./AttachBar";
import { computePopoverPosition } from "./utils";

type VariantKey = "simple" | "structured" | "advanced";

interface PopoverProps {
  open: boolean;
  result: ImproveResult | null;
  originalText: string;
  variantOverrides: Partial<Record<VariantKey, string>>;
  onVariantEdit: (variant: VariantKey, newText: string) => void;
  activeVariant: VariantKey;
  mode: ModeId;
  targetModel: TargetModel;
  tier2Note?: string;
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
  onSave: () => void;
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
  tier2Note,
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
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    visibility: "hidden",
    zIndex: 2147483647,
  });

  useLayoutEffect(() => {
    if (!open) {
      setPositionStyle({
        position: "fixed",
        top: 0,
        left: 0,
        visibility: "hidden",
        zIndex: 2147483647,
      });
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
        width: "min(380px, calc(100vw - 16px))",
        maxHeight: `${maxHeight}px`,
        height: "auto",
        overflowY: "auto",
        visibility: "visible",
        zIndex: 2147483647,
        pointerEvents: "auto",
      });
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
    tier2Note,
    attachments.length,
  ]);

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
      // Keep open when clicking the Improve/AskWise pill (sibling of this popover).
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

  if (!open || !result) return null;

  const variants: VariantSet = { ...result.variants, ...variantOverrides };
  const baseActive =
    activeVariant === "advanced" && streamingText
      ? streamingText
      : variants[activeVariant];
  const displayText = withAttachments(baseActive, attachments);

  return (
    <div
      ref={ref}
      className="aw-popover"
      style={positionStyle}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <span className="flex items-center gap-2">
          <ModeChip mode={mode} onChange={onModeChange} />
          {result.subRecipe && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              {result.subRecipe.label}
            </span>
          )}
        </span>
        <button type="button" className="aw-muted text-xs" onClick={onClose}>
          ✕
        </button>
      </div>

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
        tier2Note={tier2Note}
        streamingText={streamingText}
        onChange={(v) => {
          onVariantChange(v);
          if (v === "advanced") onRequestTier2();
        }}
        onEdit={onVariantEdit}
        onRefinePrompt={onRefinePrompt}
      />

      <AttachBar
        attachments={attachments}
        onAdd={onAttachAdd}
        onRemove={onAttachRemove}
        onError={onAttachError}
      />

      <div className="flex gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
        {!copyOnly && (
          <button
            type="button"
            className="flex-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white"
            onClick={onReplace}
          >
            Replace
          </button>
        )}
        <button
          type="button"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          onClick={onCopy}
        >
          Copy
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          onClick={onSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}
