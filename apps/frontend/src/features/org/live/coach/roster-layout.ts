import { useLayoutEffect, useState } from "react";

/**
 * What the roster shows at its own width (not the window's): the full table,
 * then Studio drops, the filters and Callback go icon-only, Year drops, and
 * under 520px each dancer becomes a card.
 */
export type RosterLayout = {
  cards: boolean;
  /** The filter tabs read as words ("Favorites 2"), not icons. */
  filterLabels: boolean;
  studio: boolean;
  /** The callback pill says "Call back" / "Called", not just the megaphone. */
  callLabel: boolean;
  year: boolean;
};

export function rosterLayout(width: number): RosterLayout {
  return {
    cards: width < 520,
    filterLabels: width >= 860,
    studio: width >= 860,
    callLabel: width >= 700,
    year: width >= 600,
  };
}

/** The roster's layout, from the width of `box` as it resizes. */
export function useRosterLayout(box: HTMLElement | null) {
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!box) return;
    // The observer reports the box's size once on observe, then on each resize.
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [box]);
  // Before the first measure, assume the table: most coaches scout on a laptop or tablet.
  return rosterLayout(width ?? Infinity);
}
