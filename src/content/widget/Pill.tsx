import type { ScoreResult } from "../../shared/types";
import { BoltIcon } from "./Icons";

interface PillProps {
  score: number;
  band: ScoreResult["band"];
  visible: boolean;
  onClick: () => void;
}

const BAND_WORD: Record<ScoreResult["band"], string> = {
  weak: "weak",
  okay: "okay",
  strong: "strong",
};

export function Pill({ score, band, visible, onClick }: PillProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      className="aw-pill"
      onClick={onClick}
      title="Improve this prompt (Alt+I)"
      aria-label={`Improve this prompt with AskWise. Current score ${score} of 100, ${BAND_WORD[band]}.`}
    >
      <BoltIcon className="aw-pill-mark" />
      <span>Improve</span>
      <span className="aw-pill-score" aria-hidden="true">
        <span className={`aw-band-dot aw-band-${band}`} />
        {score}
      </span>
    </button>
  );
}
