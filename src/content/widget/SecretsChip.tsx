import type { RedactionMatch } from "../../shared/types";

interface SecretsChipProps {
  matches: RedactionMatch[];
  expanded: boolean;
  onToggle: () => void;
}

function maskSecret(s: string): string {
  if (s.length <= 8) return "•••";
  return s.slice(0, 6) + "•••";
}

export function SecretsChip({ matches, expanded, onToggle }: SecretsChipProps) {
  if (matches.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
      <button type="button" className="text-xs font-medium text-red-700 dark:text-red-300" onClick={onToggle}>
        {matches.length} secret{matches.length > 1 ? "s" : ""} will be redacted
      </button>
      {expanded && (
        <ul className="mt-1 space-y-1 text-xs text-red-600 dark:text-red-400">
          {matches.map((m, i) => (
            <li key={i}>
              {m.type}: {maskSecret(m.original)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
