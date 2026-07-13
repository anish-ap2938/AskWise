interface PillProps {
  score: number;
  visible: boolean;
  onClick: () => void;
}

export function Pill({ score, visible, onClick }: PillProps) {
  if (!visible) return null;

  return (
    <button type="button" className="aw-pill" onClick={onClick} aria-label="AskWise — improve prompt">
      <span>⚡</span>
      <span>AskWise · {score}</span>
    </button>
  );
}
