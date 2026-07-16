import { useState } from "react";
import type { ModeId } from "../../shared/types";
import type { Attachment } from "../../shared/attachment";
import { withAttachments } from "../../shared/attachment";
import { recipes } from "../../shared/recipes";
import { diffRewrite } from "../../shared/diff";
import { RefineChat } from "./RefineChat";

type VariantKey = "simple" | "structured" | "advanced";
type TabKey = VariantKey | "refine";

interface VariantTabsProps {
  active: VariantKey;
  /** Base variants without file context woven in. */
  variants: Record<VariantKey, string>;
  attachments: Attachment[];
  /** Active variant with attachments woven — used by Refine + default preview. */
  displayText: string;
  original: string;
  tier2Note?: string;
  streamingText?: string;
  onChange: (v: VariantKey) => void;
  onEdit: (variant: VariantKey, newText: string) => void;
  onRefinePrompt: (prompt: string) => void;
}

const TABS: TabKey[] = ["simple", "structured", "advanced", "refine"];
const PLACEHOLDER_RE = /(\[[^\]\n]{3,80}\])/g;

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
            className="aw-placeholder cursor-pointer hover:ring-1 hover:ring-amber-400"
            title="Click to fill in"
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
      {segments.map((seg, i) =>
        seg.type === "added" ? (
          <span
            key={i}
            className="rounded bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200"
          >
            {seg.text}
          </span>
        ) : (
          <span key={i} className="font-medium">
            {seg.text}
          </span>
        )
      )}
    </>
  );
}

export function VariantTabs({
  active,
  variants,
  attachments,
  displayText,
  original,
  tier2Note,
  streamingText,
  onChange,
  onEdit,
  onRefinePrompt,
}: VariantTabsProps) {
  const [showDiff, setShowDiff] = useState(false);
  const [fill, setFill] = useState<{ label: string; value: string } | null>(null);
  const [tab, setTab] = useState<TabKey>(active);

  const previewFor = (key: VariantKey): string => {
    const base =
      key === "advanced" && streamingText ? streamingText : variants[key];
    return withAttachments(base, attachments);
  };

  const previewText = tab === "refine" ? displayText : previewFor(tab as VariantKey);

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

  return (
    <div>
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-700">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`flex-1 px-2 py-2 text-xs font-medium capitalize ${
              tab === t ? "aw-tab-active" : "aw-muted"
            }`}
            onClick={() => {
              setFill(null);
              setTab(t);
              if (t !== "refine") {
                onChange(t);
                setShowDiff(false);
              }
            }}
          >
            {t === "refine" ? "Refine" : t}
          </button>
        ))}
        {tab !== "refine" && (
          <button
            type="button"
            className={`px-3 py-2 text-[10px] font-medium ${showDiff ? "text-violet-500" : "aw-muted"}`}
            title="Highlight what AskWise added vs your original"
            onClick={() => setShowDiff((v) => !v)}
          >
            {showDiff ? "✓ Changes" : "Changes"}
          </button>
        )}
      </div>

      {tab === "refine" ? (
        <RefineChat currentPrompt={displayText} onPromptUpdate={onRefinePrompt} />
      ) : (
        <>
          <div className="max-h-48 overflow-y-auto px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
            {showDiff ? (
              <DiffBody original={original} text={previewText} />
            ) : (
              <PromptBody
                text={previewText}
                onPlaceholderClick={(label) => setFill({ label, value: "" })}
              />
            )}
          </div>

          {fill && (
            <div className="flex items-center gap-2 border-t border-zinc-200 px-4 py-2 dark:border-zinc-700">
              <span
                className="max-w-[110px] truncate text-[10px] aw-muted"
                title={fill.label}
              >
                {fill.label}
              </span>
              <input
                autoFocus
                className="min-w-0 flex-1 rounded border border-zinc-300 bg-transparent px-2 py-1 text-xs outline-none focus:border-violet-500 dark:border-zinc-600"
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
                className="rounded bg-violet-600 px-2 py-1 text-xs font-medium text-white"
                onClick={applyFill}
              >
                Fill
              </button>
            </div>
          )}

          {tier2Note && active === "advanced" && tab === "advanced" && (
            <p className="px-4 pb-3 text-xs aw-muted">{tier2Note}</p>
          )}
        </>
      )}
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
      className="rounded-full border border-zinc-300 bg-transparent px-2 py-0.5 text-xs dark:border-zinc-600"
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
