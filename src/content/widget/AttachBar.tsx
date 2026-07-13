import { useRef, useState } from "react";
import type { Attachment } from "../../shared/attachment";
import { MAX_ATTACHMENTS } from "../../shared/attachment";
import { ACCEPTED_EXTENSIONS, readFileToAttachment } from "../attachments";

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
        onError(`Max ${MAX_ATTACHMENTS} files — extra files were skipped.`);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Couldn't read that file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="border-t border-zinc-200 px-4 py-2 dark:border-zinc-700">
      <div className="flex flex-wrap items-center gap-1.5">
        {attachments.map((a) => (
          <span
            key={a.id}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
            title={
              `${a.words} words woven in on Replace/Copy` +
              (a.truncated ? " (excerpt)" : "") +
              (a.redactedCount > 0 ? ` — ${a.redactedCount} secret(s) redacted` : "")
            }
          >
            <span aria-hidden>{a.kind === "pdf" ? "📄" : "📃"}</span>
            <span className="max-w-[140px] truncate">{a.name}</span>
            <span className="aw-muted">
              {a.words}w{a.truncated ? "·cut" : ""}
              {a.redactedCount > 0 ? "·🔒" : ""}
            </span>
            <button
              type="button"
              className="aw-muted ml-0.5 hover:text-red-500"
              aria-label={`Remove ${a.name}`}
              onClick={() => onRemove(a.id)}
            >
              ✕
            </button>
          </span>
        ))}
        {attachments.length < MAX_ATTACHMENTS && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-2 py-0.5 text-xs aw-muted hover:border-violet-500 hover:text-violet-500 dark:border-zinc-600"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Reading…" : "📎 Attach context"}
          </button>
        )}
      </div>
      {attachments.length > 0 && (
        <p className="mt-1 text-[10px] aw-muted">
          File content stays on your device and is added when you Replace or Copy.
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
