/**
 * Inline SVG icons. They ship in the bundle rather than as files or a font so
 * the widget works under the host page's CSP and needs no extra network round
 * trip. All are 1.6px-stroke on a 16px grid and inherit `currentColor`.
 */

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

function svgProps(size: number, className?: string, style?: React.CSSProperties) {
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
    style,
  };
}

export function BoltIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path d="M9.1 1.4 3.3 8.7a.5.5 0 0 0 .39.81H7l-.9 4.9a.3.3 0 0 0 .53.24l5.8-7.3a.5.5 0 0 0-.39-.81H9l.63-4.15a.3.3 0 0 0-.53-.24Z" />
    </svg>
  );
}

export function CloseIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export function ChevronIcon({ size = 12, className, style }: IconProps) {
  return (
    <svg {...svgProps(size, className, style)}>
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

export function CopyIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" />
      <path d="M10.5 3.2A1.7 1.7 0 0 0 8.9 2H4a2 2 0 0 0-2 2v4.9c0 .74.47 1.37 1.2 1.6" />
    </svg>
  );
}

export function BookmarkIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M4 2.8h8v10.4L8 10.4l-4 2.8V2.8Z" />
    </svg>
  );
}

export function PaperclipIcon({ size = 12, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M12.5 7.3 7.8 12a2.7 2.7 0 0 1-3.8-3.8l5-5a1.8 1.8 0 0 1 2.5 2.5l-5 5a.9.9 0 0 1-1.3-1.3l4.4-4.4" />
    </svg>
  );
}

export function AlertIcon({ size = 13, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M8 2.6 1.9 13.2h12.2L8 2.6Z" />
      <path d="M8 6.6v3" />
      <path d="M8 11.4h.01" />
    </svg>
  );
}

export function CheckIcon({ size = 13, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3 8.4 6.3 11.6 13 4.8" />
    </svg>
  );
}

export function RetryIcon({ size = 13, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M13.2 8a5.2 5.2 0 1 1-1.6-3.7" />
      <path d="M13.4 2.6v3.1h-3.1" />
    </svg>
  );
}

export function DiffIcon({ size = 12, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M4 2.4v11.2M12 2.4v11.2" />
      <path d="M2.4 5.6h3.2M10.4 10.4h3.2" />
    </svg>
  );
}

export function SendIcon({ size = 13, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M2.6 8h9.6" />
      <path d="M8.4 4.2 12.2 8l-3.8 3.8" />
    </svg>
  );
}
