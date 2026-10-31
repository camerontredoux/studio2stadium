import { describe, expect, it } from "vitest";

import { nextHideOnScrollState } from "./use-hide-on-scroll";

const MAX = 2000;

describe("nextHideOnScrollState", () => {
  it("hides on a downward scroll and shows again on an upward one", () => {
    const down = nextHideOnScrollState(
      { hidden: false, anchorY: 300 },
      320,
      MAX,
    );
    expect(down.hidden).toBe(true);

    const up = nextHideOnScrollState(down, 310, MAX);
    expect(up.hidden).toBe(false);
  });

  it("ignores movement below the jitter threshold", () => {
    const state = { hidden: false, anchorY: 300 };
    expect(nextHideOnScrollState(state, 305, MAX)).toBe(state);
  });

  it("keeps the bars shown near the top of the page", () => {
    const state = nextHideOnScrollState({ hidden: true, anchorY: 10 }, 40, MAX);
    expect(state.hidden).toBe(false);
  });

  it("ignores rubber-band overscroll at both ends", () => {
    const top = nextHideOnScrollState({ hidden: false, anchorY: 0 }, -60, MAX);
    expect(top.hidden).toBe(false);

    const atBottom = { hidden: true, anchorY: MAX };
    const bounced = nextHideOnScrollState(atBottom, MAX + 80, MAX);
    expect(nextHideOnScrollState(bounced, MAX, MAX).hidden).toBe(true);
  });
});
