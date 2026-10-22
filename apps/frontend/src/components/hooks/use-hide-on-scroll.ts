import * as React from "react";
import { flushSync } from "react-dom";

// Movement smaller than this is jitter, not a scroll direction.
const SCROLL_THRESHOLD = 8;
// Bars stay shown while the page is within the header's height of the top.
const TOP_ZONE = 48;

// The bars and the sticky elements pinned under the top bar (the top-header
// utilities) slide with one shared animation.
const SLIDING = '[data-hide-on-scroll], [class*="top-header"]';
const SLIDE_ID = "hide-on-scroll";
const SLIDE: KeyframeAnimationOptions = {
  id: SLIDE_ID,
  duration: 150,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
};

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

/*
  Applies the change, then animates each sliding element from where it was to
  where the change put it. Positions jump at once and only a transform
  animates, so the slide runs on the compositor. Animating the sticky `top`
  instead lags behind the bars on iOS Safari. A sticky element that is not
  stuck does not move, so it gets no animation.
*/
function slide(root: HTMLElement | null, change: () => void) {
  const elements = root
    ? Array.from(root.querySelectorAll<HTMLElement>(SLIDING))
    : [];
  const before = elements.map((el) => el.getBoundingClientRect().top);
  for (const el of elements) {
    for (const animation of el.getAnimations()) {
      if (animation.id === SLIDE_ID) animation.cancel();
    }
  }

  change();

  elements.forEach((el, i) => {
    const offset = before[i] - el.getBoundingClientRect().top;
    if (Math.abs(offset) < 0.5) return;
    el.animate(
      [{ transform: `translateY(${offset}px)` }, { transform: "none" }],
      SLIDE,
    );
  });
}

/** Hides fixed bars while the window scrolls down and shows them on any scroll up. */
export function useHideOnScroll(
  enabled: boolean,
  rootRef: React.RefObject<HTMLElement | null>,
) {
  const [hidden, setHidden] = React.useState(false);
  const stateRef = React.useRef<HideOnScrollState>({
    hidden: false,
    anchorY: 0,
  });

  // Renders the change right away, so the slide starts in the same frame as
  // the scroll that crossed the threshold.
  const apply = React.useCallback(
    (next: HideOnScrollState) => {
      const changed = next.hidden !== stateRef.current.hidden;
      stateRef.current = next;
      if (changed) {
        slide(rootRef.current, () => flushSync(() => setHidden(next.hidden)));
      }
    },
    [rootRef],
  );

  React.useEffect(() => {
    if (!enabled) return;

    stateRef.current = { hidden: false, anchorY: window.scrollY };

    const onScroll = () => {
      const maxScrollY =
        document.documentElement.scrollHeight - window.innerHeight;
      apply(
        nextHideOnScrollState(stateRef.current, window.scrollY, maxScrollY),
      );
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      setHidden(false);
    };
  }, [enabled, apply]);

  // Keyboard focus inside a hidden bar brings it back into view.
  const reveal = React.useCallback(() => {
    apply({ ...stateRef.current, hidden: false });
  }, [apply]);

  return { hidden: enabled && hidden, reveal };
}
