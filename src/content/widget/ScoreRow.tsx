import type { ScoreResult } from "../../shared/types";
import { summarizeFix } from "../../shared/diff";

interface ScoreRowProps {
  before: ScoreResult;
  after: ScoreResult;
  expanded: boolean;
  onToggle: () => void;
}

function bandColor(band: ScoreResult["band"]): string {
  switch (band) {
    case "strong":
      return "text-green-600 dark:text-green-400";
    case "okay":
      return "text-amber-600 dark:text-amber-400";
    default:
      return "text-red-600 dark:text-red-400";
  }
}

export function ScoreRow({ before, after, expanded, onToggle }: ScoreRowProps) {
  const lift = after.total - before.total;

  return (
    <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
      <button type="button" className="flex w-full items-center justify-between" onClick={onToggle}>
        <span className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${bandColor(before.band)}`}>{before.total}</span>
          <span className="aw-muted text-lg">→</span>
          <span className={`text-2xl font-bold ${bandColor(after.band)}`}>{after.total}</span>
          {lift > 0 && (
            <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
              +{lift}
            </span>
          )}
        </span>
        <span className="aw-muted text-xs">{expanded ? "Hide details" : "Details"}</span>
      </button>
      <p className="mt-1 text-xs aw-muted">{summarizeFix(before, after)}</p>
      {expanded && before.missing.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs aw-muted">
          {before.missing.map((m) => (
            <li key={m}>• {m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
