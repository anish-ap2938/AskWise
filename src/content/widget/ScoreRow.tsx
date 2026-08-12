import type { ScoreResult } from "../../shared/types";
import { summarizeFix } from "../../shared/diff";
import { ChevronIcon } from "./Icons";

interface ScoreRowProps {
  before: ScoreResult;
  after: ScoreResult;
  expanded: boolean;
  onToggle: () => void;
}

export function ScoreRow({ before, after, expanded, onToggle }: ScoreRowProps) {
  const lift = after.total - before.total;

  return (
    <div className="aw-score-block">
      <button
        type="button"
        className="aw-score"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls="aw-score-detail"
      >
        <span className="aw-score-head">
          <span className="aw-score-values">
            <span className="aw-score-before">{before.total}</span>
            <span className="aw-score-arrow" aria-hidden="true">
              →
            </span>
            <span className={`aw-score-after aw-band-${after.band}`}>
              {after.total}
            </span>
            <span className="aw-score-max">/100</span>
            {lift > 0 && <span className="aw-chip aw-chip-success">+{lift}</span>}
          </span>
          <span className="aw-score-toggle">
            {expanded ? "Hide" : "Why"}
            <ChevronIcon
              style={{ transform: expanded ? "rotate(180deg)" : undefined }}
            />
          </span>
        </span>

        <span className="aw-meter" aria-hidden="true">
          <span className="aw-meter-before" style={{ width: `${before.total}%` }} />
          <span className="aw-meter-after" style={{ width: `${after.total}%` }} />
        </span>

        <span className="aw-score-summary">{summarizeFix(before, after)}</span>
      </button>

      {expanded && (
        <ul id="aw-score-detail" className="aw-score-detail">
          {before.missing.length > 0 ? (
            before.missing.map((m) => <li key={m}>{m}</li>)
          ) : (
            <li>Your prompt already covers everything the rubric checks for.</li>
          )}
        </ul>
      )}
    </div>
  );
}
