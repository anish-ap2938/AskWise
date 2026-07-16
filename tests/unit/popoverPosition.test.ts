import { describe, it, expect } from "vitest";
import { computePopoverPosition } from "../../src/content/widget/utils";

function rect(
  partial: Partial<DOMRect> & {
    top: number;
    left: number;
    bottom: number;
    right: number;
  }
): DOMRect {
  return {
    x: partial.left,
    y: partial.top,
    width: partial.right - partial.left,
    height: partial.bottom - partial.top,
    toJSON: () => ({}),
    ...partial,
  } as DOMRect;
}

describe("computePopoverPosition", () => {
  const viewport = { width: 1200, height: 800 };

  it("places the popover above the pill when there is more room above", () => {
    const pill = rect({ top: 600, bottom: 640, left: 900, right: 1050 });
    const pos = computePopoverPosition(pill, 380, 400, viewport);
    expect(pos.top).toBe(600 - 8 - 400);
    expect(pos.left).toBe(1050 - 380);
    expect(pos.maxHeight).toBe(400);
    expect(pos.top + pos.maxHeight).toBeLessThanOrEqual(viewport.height - 8);
  });

  it("flips below when there is more room below", () => {
    const pill = rect({ top: 40, bottom: 80, left: 900, right: 1050 });
    const pos = computePopoverPosition(pill, 380, 400, viewport);
    expect(pos.top).toBe(80 + 8);
    expect(pos.top + pos.maxHeight).toBeLessThanOrEqual(viewport.height - 8);
  });

  it("clamps horizontally so it never leaves the viewport", () => {
    const pill = rect({ top: 600, bottom: 640, left: 10, right: 120 });
    const pos = computePopoverPosition(pill, 380, 300, viewport);
    expect(pos.left).toBe(8);
    expect(pos.left + 380).toBeLessThanOrEqual(viewport.width - 8);
  });

  it("caps maxHeight on short viewports so the box stays on-screen", () => {
    const short = { width: 400, height: 360 };
    const pill = rect({ top: 300, bottom: 340, left: 200, right: 340 });
    const pos = computePopoverPosition(pill, 380, 500, short);
    expect(pos.maxHeight).toBeLessThanOrEqual(short.height - 16);
    expect(pos.top).toBeGreaterThanOrEqual(8);
    expect(pos.top + pos.maxHeight).toBeLessThanOrEqual(short.height - 8);
  });
});
