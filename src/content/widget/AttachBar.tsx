import { useRef, useState } from "react";
import type { Attachment } from "../../shared/attachment";
import { MAX_ATTACHMENTS } from "../../shared/attachment";
import { ACCEPTED_EXTENSIONS, readFileToAttachment } from "../attachments";
import { CloseIcon, PaperclipIcon } from "./Icons";

interface AttachBarProps {
  attachments: Attachment[];
  onAdd: (attachment: Attachment) => void;
  onRemove: (id: string) => void;
  onError: (message: string) => void;
}

export function AttachBar({ attachments, onAdd, onRemove, onError }: AttachBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const room = MAX_ATTACHMENTS - attachments.length;
      for (const file of Array.from(files).slice(0, room)) {
        onAdd(await readFileToAttachment(file));
      }
      if (files.length > room) {
        onError(`AskWise takes ${MAX_ATTACHMENTS} files at a time — the rest were skipped.`);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Couldn't read that file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="aw-attach">
      <div className="aw-attach-list">
        {attachments.map((a) => (
          <span
            key={a.id}
            className="aw-attach-chip"
            title={
              `${a.words} words woven into the prompt` +
              (a.truncated ? " (excerpt only)" : "") +
              (a.redactedCount > 0 ? ` — ${a.redactedCount} secret(s) masked` : "")
            }
          >
            <span className="aw-attach-name aw-truncate">{a.name}</span>
            <span className="aw-attach-meta">
              {a.words}w{a.truncated ? " · cut" : ""}
              {a.redactedCount > 0 ? " · masked" : ""}
            </span>
            <button
              type="button"
              className="aw-attach-remove"
              aria-label={`Remove ${a.name}`}
              onClick={() => onRemove(a.id)}
            >
              <CloseIcon size={10} />
            </button>
          </span>
        ))}
        {attachments.length < MAX_ATTACHMENTS && (
          <button
            type="button"
            className="aw-attach-add"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <PaperclipIcon />
            {busy ? "Reading…" : "Attach context"}
          </button>
        )}
      </div>
      {attachments.length > 0 && (
        <p className="aw-attach-hint">
          Read in this tab and pasted into the prompt. The file itself is never
          uploaded.
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple
        hidden
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </div>
  );
}
