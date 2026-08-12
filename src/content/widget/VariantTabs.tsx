import { useRef, useState } from "react";
import type { ModeId } from "../../shared/types";
import type { Attachment } from "../../shared/attachment";
import { withAttachments } from "../../shared/attachment";
import { recipes } from "../../shared/recipes";
import { diffRewrite } from "../../shared/diff";
import { RefineChat } from "./RefineChat";
import { AlertIcon, DiffIcon, RetryIcon } from "./Icons";

type VariantKey = "simple" | "structured" | "advanced";
type TabKey = VariantKey | "refine";

/** Status of the on-device (Advanced) rewrite. */
export type AdvancedState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; note: string }
  | { status: "error"; message: string };

interface VariantTabsProps {
  active: VariantKey;
  /** Base variants without file context woven in. */
  variants: Record<VariantKey, string>;
  attachments: Attachment[];
  /** Active variant with attachments woven — used by Refine + default preview. */
  displayText: string;
  original: string;
  advanced: AdvancedState;
  streamingText?: string;
  onChange: (v: VariantKey) => void;
  onEdit: (variant: VariantKey, newText: string) => void;
  onRefinePrompt: (prompt: string) => void;
  onRetryAdvanced: () => void;
}

const TABS: { key: TabKey; label: string; hint: string }[] = [
  { key: "simple", label: "Simple", hint: "One tightened sentence" },
  { key: "structured", label: "Structured", hint: "Sectioned prompt" },
  { key: "advanced", label: "Advanced", hint: "Rewritten by the on-device model" },
  { key: "refine", label: "Refine", hint: "Chat with the on-device model" },
];

const PLACEHOLDER_RE = /(\[[^\]\n]{3,80}\])/g;

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function PromptBody({
  text,
  onPlaceholderClick,
}: {
  text: string;
  onPlaceholderClick: (label: string) => void;
}) {
  const parts = text.split(PLACEHOLDER_RE);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <button
            key={i}
            type="button"
            className="aw-placeholder"
            title="Fill this in"
            aria-label={`Fill in ${part.slice(1, -1)}`}
            onClick={() => onPlaceholderClick(part)}
          >
            {part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function DiffBody({ original, text }: { original: string; text: string }) {
  const segments = diffRewrite(original, text);
  return (
    <>
      {segments.map((seg, i) => (
        <span
          key={i}
          className={seg.type === "added" ? "aw-diff-added" : "aw-diff-same"}
        >
          {seg.text}
        </span>
      ))}
    </>
  );
}

function Skeleton() {
  return (
    <div className="aw-skeleton" aria-hidden="true">
      <div className="aw-skeleton-line" style={{ width: "92%" }} />
      <div className="aw-skeleton-line" style={{ width: "78%" }} />
      <div className="aw-skeleton-line" style={{ width: "85%" }} />
      <div className="aw-skeleton-line" style={{ width: "46%" }} />
    </div>
  );
}

export function VariantTabs({
  active,
  variants,
  attachments,
  displayText,
  original,
  advanced,
  streamingText,
  onChange,
  onEdit,
  onRefinePrompt,
  onRetryAdvanced,
}: VariantTabsProps) {
  const [showDiff, setShowDiff] = useState(false);
  const [fill, setFill] = useState<{ label: string; value: string } | null>(null);
  const [tab, setTab] = useState<TabKey>(active);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const previewFor = (key: VariantKey): string => {
    const base =
      key === "advanced" && streamingText ? streamingText : variants[key];
    return withAttachments(base, attachments);
  };

  const previewText = tab === "refine" ? displayText : previewFor(tab as VariantKey);

  const selectTab = (next: TabKey) => {
    setFill(null);
    setTab(next);
    if (next !== "refine") {
      onChange(next);
      setShowDiff(false);
    }
  };

  // Roving focus so the tab strip behaves like a real tablist.
  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    let nextIndex = index;
    if (delta !== 0) nextIndex = (index + delta + TABS.length) % TABS.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = TABS.length - 1;
    else return;

    e.preventDefault();
    selectTab(TABS[nextIndex]!.key);
    tabRefs.current[nextIndex]?.focus();
  };

  const applyFill = () => {
    if (!fill || !fill.value.trim() || tab === "refine") {
      setFill(null);
      return;
    }
    const key = tab as VariantKey;
    // Edit the base variant (without attachment block) so files don't double-weave.
    onEdit(key, variants[key].replace(fill.label, fill.value.trim()));
    setFill(null);
  };

  const isAdvanced = tab === "advanced";
  const streaming = isAdvanced && advanced.status === "loading" && !!streamingText;
  const showSkeleton = isAdvanced && advanced.status === "loading" && !streamingText;

  return (
    <div>
      <div className="aw-tabs" role="tablist" aria-label="Prompt variants">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`aw-tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls="aw-panel"
            tabIndex={tab === t.key ? 0 : -1}
            title={t.hint}
            className="aw-tab"
            onClick={() => selectTab(t.key)}
            onKeyDown={(e) => onTabKeyDown(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        id="aw-panel"
        role="tabpanel"
        aria-labelledby={`aw-tab-${tab}`}
        tabIndex={-1}
      >
        {tab === "refine" ? (
          <RefineChat currentPrompt={displayText} onPromptUpdate={onRefinePrompt} />
        ) : (
          <>
            <div className="aw-preview-bar">
              <span className="aw-preview-meta">
                {showSkeleton || streaming
                  ? "Writing on your device…"
                  : `${countWords(previewText)} words`}
              </span>
              <button
                type="button"
                className="aw-toggle"
                aria-pressed={showDiff}
                title="Highlight what AskWise added to your original"
                onClick={() => setShowDiff((v) => !v)}
              >
                <DiffIcon />
                Changes
              </button>
            </div>

            {showSkeleton ? (
              <Skeleton />
            ) : (
              <div className="aw-preview">
                {showDiff ? (
                  <DiffBody original={original} text={previewText} />
                ) : (
                  <PromptBody
                    text={previewText}
                    onPlaceholderClick={(label) => setFill({ label, value: "" })}
                  />
                )}
                {streaming && <span className="aw-caret" aria-hidden="true" />}
              </div>
            )}

            {fill && (
              <div className="aw-fill">
                <span className="aw-fill-label aw-truncate" title={fill.label}>
                  {fill.label}
                </span>
                <input
                  autoFocus
                  className="aw-input"
                  aria-label={`Value for ${fill.label}`}
                  placeholder="Type the real value…"
                  value={fill.value}
                  onChange={(e) => setFill({ ...fill, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFill();
                    if (e.key === "Escape") setFill(null);
                  }}
                />
                <button
                  type="button"
                  className="aw-btn aw-btn-primary aw-btn-sm"
                  style={{ flex: "none" }}
                  onClick={applyFill}
                >
                  Fill
                </button>
              </div>
            )}

            {isAdvanced && advanced.status === "error" && (
              <div className="aw-error" role="alert">
                <AlertIcon className="aw-band-weak" />
                <span className="aw-error-text">{advanced.message}</span>
                <button
                  type="button"
                  className="aw-btn aw-btn-secondary aw-btn-sm"
                  onClick={onRetryAdvanced}
                >
                  <RetryIcon />
                  Retry
                </button>
              </div>
            )}

            {isAdvanced && advanced.status === "idle" && (
              <div className="aw-note aw-note-action">
                <span>This is the template. Rewrite it with the model on your device?</span>
                <button
                  type="button"
                  className="aw-btn aw-btn-secondary aw-btn-sm"
                  onClick={onRetryAdvanced}
                >
                  Rewrite
                </button>
              </div>
            )}

            {isAdvanced && advanced.status === "ready" && advanced.note && (
              <p className="aw-note">{advanced.note}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface ModeChipProps {
  mode: ModeId;
  onChange: (mode: ModeId) => void;
}

export function ModeChip({ mode, onChange }: ModeChipProps) {
  return (
    <select
      className="aw-select"
      aria-label="Prompt type"
      title="AskWise picked this from your text — change it if it guessed wrong"
      value={mode}
      onChange={(e) => onChange(e.target.value as ModeId)}
    >
      {recipes.map((r) => (
        <option key={r.id} value={r.id}>
          {r.label}
        </option>
      ))}
    </select>
  );
}
