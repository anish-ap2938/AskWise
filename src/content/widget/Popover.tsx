import { useEffect, useRef } from "react";
import type { ImproveResult } from "../../shared/improve";
import type { ModeId, TargetModel, VariantSet } from "../../shared/types";
import type { Attachment } from "../../shared/attachment";
import { ModeChip, VariantTabs } from "./VariantTabs";
import { ScoreRow } from "./ScoreRow";
import { SecretsChip } from "./SecretsChip";
import { AttachBar } from "./AttachBar";

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
}: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={ref}
      className="aw-popover"
      style={{ bottom: "100%", right: 0, marginBottom: 8 }}
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
        original={originalText}
        tier2Note={tier2Note}
        streamingText={streamingText}
        onChange={(v) => {
          onVariantChange(v);
          if (v === "advanced") onRequestTier2();
        }}
        onEdit={onVariantEdit}
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
