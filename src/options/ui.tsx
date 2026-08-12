/**
 * Shared presentational pieces for the options and onboarding pages.
 * Icons are inline SVG (no icon package, no font request) on a 16px grid with a
 * 1.6px stroke, and inherit `currentColor`.
 */

import type { ReactNode } from "react";

interface IconProps {
  size?: number;
  className?: string;
}

function stroke(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: "false" as const,
    className,
  };
}

export function CheckIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...stroke(size, className)}>
      <path d="M3 8.4 6.3 11.6 13 4.8" />
    </svg>
  );
}

export function AlertIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...stroke(size, className)}>
      <path d="M8 2.6 1.9 13.2h12.2L8 2.6Z" />
      <path d="M8 6.6v3" />
      <path d="M8 11.4h.01" />
    </svg>
  );
}

export function DownloadIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...stroke(size, className)}>
      <path d="M8 2.4v7.2" />
      <path d="M4.8 6.8 8 10l3.2-3.2" />
      <path d="M2.8 12.6h10.4" />
    </svg>
  );
}

export function TrashIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...stroke(size, className)}>
      <path d="M2.8 4.4h10.4" />
      <path d="M6.4 4.4V2.8h3.2v1.6" />
      <path d="M4.2 4.4l.6 8.2h6.4l.6-8.2" />
    </svg>
  );
}

export function ExternalIcon({ size = 12, className }: IconProps) {
  return (
    <svg {...stroke(size, className)}>
      <path d="M6.4 3.2H3.4v9.4h9.4V9.6" />
      <path d="M9.4 2.8h3.8v3.8" />
      <path d="M13.2 2.8 8 8" />
    </svg>
  );
}

/**
 * A titled block. `description` sits under the heading rather than inside the
 * card so the card only holds controls — keeps the scan line clean.
 */
export function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">{title}</h2>
          {description && (
            <p className="max-w-prose text-sm text-ink-muted">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ProgressBar({
  value,
  label,
  tone = "neutral",
}: {
  /** 0–1 */
  value: number;
  label: string;
  tone?: "neutral" | "positive";
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-hairline"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full ${tone === "positive" ? "bg-positive" : "bg-ink"}`}
        style={{
          width: `${pct}%`,
          transition: "width 300ms cubic-bezier(0.2, 0.6, 0.25, 1)",
        }}
      />
    </div>
  );
}

export type StatusTone = "neutral" | "working" | "ready" | "warn" | "error";

const STATUS_STYLE: Record<StatusTone, string> = {
  neutral: "bg-sunken text-ink-muted",
  working: "bg-accent-soft text-accent-ink",
  ready: "bg-positive-soft text-positive",
  warn: "bg-accent-soft text-accent-ink",
  error: "bg-critical-soft text-critical",
};

export function StatusPill({
  tone,
  children,
}: {
  tone: StatusTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[tone]}`}
    >
      {tone === "ready" && <CheckIcon size={12} />}
      {(tone === "error" || tone === "warn") && <AlertIcon size={12} />}
      {children}
    </span>
  );
}
