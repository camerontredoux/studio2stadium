import * as React from "react";

// Movement smaller than this is jitter, not a scroll direction.
const SCROLL_THRESHOLD = 8;
// Bars stay shown while the page is within the header's height of the top.
const TOP_ZONE = 48;

export interface HideOnScrollState {
  hidden: boolean;
  anchorY: number;
}

export function nextHideOnScrollState(
  state: HideOnScrollState,
  scrollY: number,
  maxScrollY: number,
): HideOnScrollState {
  // Clamping drops iOS rubber-band overscroll past either end of the page.
  const y = Math.min(Math.max(scrollY, 0), Math.max(maxScrollY, 0));
  if (y <= TOP_ZONE) return { hidden: false, anchorY: y };

  const delta = y - state.anchorY;
  if (Math.abs(delta) < SCROLL_THRESHOLD) return state;
  return { hidden: delta > 0, anchorY: y };
}

/** Hides fixed bars while the window scrolls down and shows them on any scroll up. */
export function useHideOnScroll(enabled: boolean) {
  const [hidden, setHidden] = React.useState(false);
  const stateRef = React.useRef<HideOnScrollState>({
    hidden: false,
    anchorY: 0,
  });

  React.useEffect(() => {
    if (!enabled) return;

    stateRef.current = { hidden: false, anchorY: window.scrollY };
    let frame = 0;

    const update = () => {
      frame = 0;
      const maxScrollY =
        document.documentElement.scrollHeight - window.innerHeight;
      stateRef.current = nextHideOnScrollState(
        stateRef.current,
        window.scrollY,
        maxScrollY,
      );
      setHidden(stateRef.current.hidden);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      setHidden(false);
    };
  }, [enabled]);

  // Keyboard focus inside a hidden bar brings it back into view.
  const reveal = React.useCallback(() => {
    stateRef.current = { ...stateRef.current, hidden: false };
    setHidden(false);
  }, []);

  return { hidden: enabled && hidden, reveal };
}
