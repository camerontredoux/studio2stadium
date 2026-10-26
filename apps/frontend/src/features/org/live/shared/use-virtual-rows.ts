import { useVirtualizer, useWindowVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useState, type RefObject } from "react";

import { useIsPhone } from "@/features/org/live/admin/rosters/use-is-phone";

/**
 * Only the rows near the viewport are in the DOM. An org's lists run to the
 * thousands, and rendering every row made each search, sort and mark take
 * seconds. Asking for the next page as the end comes into view keeps scrolling
 * continuous.
 *
 * From the desk breakpoint up the rows scroll in `scrollRef`; at phone width
 * the page itself scrolls, so they follow the window, offset by where `list`
 * starts on the page. With `boxOnly` the rows scroll in `scrollRef` at every
 * width, below whatever else the box holds above `list`.
 */
export function useVirtualRows({
  count,
  scrollRef,
  list,
  estimate = 45,
  hasMore,
  loadingMore,
  onLoadMore,
  resetKey,
  boxOnly = false,
}: {
  count: number;
  scrollRef: RefObject<HTMLElement | null>;
  list: HTMLElement | null;
  /** A row's height before it's measured. */
  estimate?: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore?: () => void;
  /** A change (new tab, search, filter or sort) starts the list again from the top. */
  resetKey?: unknown;
  /** Scroll in `scrollRef` on phones too, for a list inside a fixed-height box. */
  boxOnly?: boolean;
}) {
  const phone = useIsPhone() && !boxOnly;
  const [listTop, setListTop] = useState(0);
  useLayoutEffect(() => {
    if (phone && list)
      setListTop(list.getBoundingClientRect().top + window.scrollY);
  }, [phone, list]);
  // In a box, content above the list (Top choices' ranked slots) can change
  // height on any render, so measure where the list starts every time. An
  // unchanged value doesn't render again.
  const [boxTop, setBoxTop] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs every render
  useLayoutEffect(() => {
    const box = scrollRef.current;
    if (!boxOnly || !list || !box) return;
    setBoxTop(
      list.getBoundingClientRect().top -
        box.getBoundingClientRect().top +
        box.scrollTop,
    );
  });

  const inBox = useVirtualizer({
    count,
    enabled: !phone,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimate,
    overscan: 10,
    scrollMargin: boxTop,
  });
  const inWindow = useWindowVirtualizer({
    count,
    enabled: phone,
    estimateSize: () => estimate,
    overscan: 10,
    scrollMargin: listTop,
  });
  const virtualizer = phone ? inWindow : inBox;

  // A row measured above the viewport shifts the rows below it, so the
  // virtualizer scrolls by the difference. By default it judges "above" by its
  // own offset, which lags a programmatic scroll until the scroll event: after
  // a reset to the top, the new rows looked above the old offset and scrolled
  // the box back down to it. Judge by where the box or page really is.
  inBox.shouldAdjustScrollPositionOnItemSizeChange = (item) =>
    item.start < (scrollRef.current?.scrollTop ?? 0);
  inWindow.shouldAdjustScrollPositionOnItemSizeChange = (item) =>
    item.start < window.scrollY;

  // Through the virtualizer, not the element, so its measured heights start
  // over with the new rows. Compared by value: callers pass a fresh array or
  // object each render.
  const reset = JSON.stringify(resetKey ?? null);
  useLayoutEffect(() => {
    if (phone) return;
    inBox.measure();
    inBox.scrollToOffset(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only on a reset
  }, [reset]);
  const items = virtualizer.getVirtualItems();
  const margin = phone ? listTop : boxTop;
  const first = items[0];
  const last = items.at(-1);

  useEffect(() => {
    if (last && last.index >= count - 1 && hasMore && !loadingMore)
      onLoadMore?.();
  }, [last, count, hasMore, loadingMore, onLoadMore]);

  return {
    items,
    measure: virtualizer.measureElement,
    /**
     * True for the last row once every page has loaded. The container's own
     * border closes the list, so that row drops its divider; the list's
     * `last:` rule can't see it inside its measuring wrapper.
     */
    isLast: (index: number) => !hasMore && index === count - 1,
    padTop: first ? first.start - margin : 0,
    padBottom: last ? virtualizer.getTotalSize() - (last.end - margin) : 0,
  };
}
