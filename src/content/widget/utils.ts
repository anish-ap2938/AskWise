export function highlightPlaceholders(text: string): string {
  return text.replace(/\[([^\]]+)\]/g, '<span class="aw-placeholder">[$1]</span>');
}

const VIEWPORT_MARGIN = 8;
const PILL_GAP = 8;
const MIN_POPOVER_HEIGHT = 160;

/** Place a popover next to a pill without overflowing the viewport. */
export function computePopoverPosition(
  pill: DOMRect,
  popoverWidth: number,
  popoverHeight: number,
  viewport = { width: window.innerWidth, height: window.innerHeight }
): { top: number; left: number; maxHeight: number } {
  const width = Math.min(popoverWidth, viewport.width - VIEWPORT_MARGIN * 2);
  const maxPossible = Math.max(
    MIN_POPOVER_HEIGHT,
    viewport.height - VIEWPORT_MARGIN * 2
  );

  const spaceAbove = pill.top - VIEWPORT_MARGIN - PILL_GAP;
  const spaceBelow = viewport.height - pill.bottom - VIEWPORT_MARGIN - PILL_GAP;
  const preferAbove = spaceAbove >= spaceBelow;

  const available = Math.max(
    MIN_POPOVER_HEIGHT,
    preferAbove ? spaceAbove : spaceBelow
  );
  const maxHeight = Math.min(popoverHeight, available, maxPossible);
  const height = maxHeight;

  let top = preferAbove
    ? pill.top - PILL_GAP - height
    : pill.bottom + PILL_GAP;

  // If the preferred side still can't fit, park inside the viewport.
  if (top < VIEWPORT_MARGIN) top = VIEWPORT_MARGIN;
  if (top + height > viewport.height - VIEWPORT_MARGIN) {
    top = Math.max(VIEWPORT_MARGIN, viewport.height - VIEWPORT_MARGIN - height);
  }

  let left = pill.right - width;
  left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(left, viewport.width - width - VIEWPORT_MARGIN)
  );

  return { top, left, maxHeight };
}
