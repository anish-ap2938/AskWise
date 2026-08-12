import type { RedactionMatch } from "../../shared/types";
import { AlertIcon, ChevronIcon } from "./Icons";

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
    <div className="aw-secrets">
      <button
        type="button"
        className="aw-secrets-toggle"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls="aw-secrets-list"
      >
        <AlertIcon />
        <span className="aw-grow">
          {matches.length} secret{matches.length > 1 ? "s" : ""} found
        </span>
        <ChevronIcon
          style={{ transform: expanded ? "rotate(180deg)" : undefined }}
        />
      </button>
      <p className="aw-secrets-note">
        Redacted before the on-device model reads your prompt. They stay in the
        text you send to the chat, so remove them yourself if that matters.
      </p>
      {expanded && (
        <ul id="aw-secrets-list" className="aw-secrets-list">
          {matches.map((m, i) => (
            <li key={i}>
              <span className="aw-secrets-type">{m.type}:</span>{" "}
              {maskSecret(m.original)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
