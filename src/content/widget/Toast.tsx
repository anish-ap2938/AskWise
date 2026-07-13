interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  visible: boolean;
}

export function Toast({ message, actionLabel, onAction, visible }: ToastProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[2147483647] -translate-x-1/2 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white shadow-xl">
      <span>{message}</span>
      {actionLabel && onAction && (
        <button type="button" className="ml-3 font-semibold text-violet-300" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
