import { CloseIcon } from "./Icons";

interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  visible: boolean;
}

export function Toast({
  message,
  actionLabel,
  onAction,
  onDismiss,
  visible,
}: ToastProps) {
  if (!visible) return null;

  return (
    <div className="aw-toast" role="status" aria-live="polite">
      <span className="aw-grow">{message}</span>
      {actionLabel && onAction && (
        <button type="button" className="aw-toast-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      <button
        type="button"
        className="aw-toast-close"
        aria-label="Dismiss"
        onClick={onDismiss}
      >
        <CloseIcon size={12} />
      </button>
    </div>
  );
}
