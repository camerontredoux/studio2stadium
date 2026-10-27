import type { Virtualizer } from "@tanstack/react-virtual";
import { describe, expect, it } from "vitest";

import { observeBoxRect } from "./observe-box-rect";

/** A virtualizer watching a box `height` tall in a window `innerHeight` tall. */
function boxOf(height: number, innerHeight = 900) {
  return {
    scrollElement: { offsetWidth: 600, offsetHeight: height },
    targetWindow: { innerHeight },
    options: {},
  } as unknown as Virtualizer<HTMLDivElement, Element>;
}

function firstReport(instance: Virtualizer<HTMLDivElement, Element>) {
  const reports: { width: number; height: number }[] = [];
  observeBoxRect(instance, (rect) => reports.push(rect));
  return reports[0];
}

describe("observeBoxRect", () => {
  it("reports the box's own size once it has a height", () => {
    expect(firstReport(boxOf(743))).toEqual({ width: 600, height: 743 });
  });

  // Coming back from phone width, the Dancers box had no rows, so it measured
  // 0, so the virtualizer showed no rows: the panel stayed empty.
  it("reports the viewport's height while the box has none", () => {
    expect(firstReport(boxOf(0))).toEqual({ width: 600, height: 900 });
  });
});
