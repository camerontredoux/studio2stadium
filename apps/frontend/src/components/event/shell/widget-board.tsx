import * as React from "react";

import { matches, SHELL_MEDIA } from "@/components/event/shell/breakpoints";
import { WidgetBoardContext } from "@/components/event/shell/widget-board-context";
import { useCallbackRef } from "@/components/hooks/use-callback-ref";
import { cn } from "@/components/utils/cn";

/** Track-list transitions run only this long after an open or close, so resizes don't animate. */
const ANIM_MS = 600;
/** The open animation's length; the scroll runs in step with it. */
const SCROLL_MS = 500;
/** On phones each widget above the opened one is a 44px strip plus an 8px gap. */
const PHONE_STRIP_STEP = 52;
/** The board's top lands this far below the scroll container's top. */
const SCROLL_GAP = 8;

type WidgetBoardProps = Omit<React.ComponentProps<"div">, "children"> & {
  /**
   * Widget ids in display order. Its length is the board's widget count (3–6) and each
   * `Widget`'s `id` must appear in it; children can be in any DOM order.
   */
  order: readonly string[];
  /**
   * Two-row boards (5 or 6 widgets): how many sit in the first row while all are peeks
   * (3 or 4; default 4 when there are more than 4 widgets). The rest form row 2. At 1180px
   * and under, two-row boards go to 3 columns. When one opens, all join a single row.
   */
  firstRow?: 3 | 4;
  /** Controlled open widget id (null = all peeks). */
  open?: string | null;
  defaultOpen?: string | null;
  onOpenChange?: (id: string | null) => void;
  children: React.ReactNode;
};

function ease(p: number) {
  return 1 - (1 - p) ** 4;
}

function scrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement;
  while (node && node !== document.body) {
    if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * The dashboard's widget grid. One widget opens at a time; the rest fold into 44px strips.
 * Animates its track lists over 500ms and scrolls the board into view in step with it.
 */
function WidgetBoard({
  order,
  firstRow,
  open: openProp,
  defaultOpen = null,
  onOpenChange,
  className,
  children,
  ...props
}: WidgetBoardProps) {
  const [innerOpen, setInnerOpen] = React.useState<string | null>(defaultOpen);
  const requested = openProp !== undefined ? openProp : innerOpen;
  const openId =
    requested !== null && order.includes(requested) ? requested : null;
  const [anim, setAnim] = React.useState(false);
  const boardRef = React.useRef<HTMLDivElement>(null);
  const animTimer = React.useRef<number | undefined>(undefined);
  const scrollRaf = React.useRef<number | undefined>(undefined);
  const notify = useCallbackRef(onOpenChange);

  React.useEffect(
    () => () => {
      window.clearTimeout(animTimer.current);
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    },
    [],
  );

  const scrollInStep = React.useCallback(
    (id: string) => {
      const board = boardRef.current;
      if (!board) return;
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      const sc = scrollParent(board);
      const from = sc ? sc.scrollTop : window.scrollY;
      const viewTop = sc ? sc.getBoundingClientRect().top : 0;
      const phoneOffset = matches(SHELL_MEDIA.phone)
        ? order.indexOf(id) * PHONE_STRIP_STEP
        : 0;
      const to = Math.max(
        0,
        from +
          board.getBoundingClientRect().top -
          viewTop -
          SCROLL_GAP +
          phoneOffset,
      );
      const dist = to - from;
      if (Math.abs(dist) <= 1) return;
      const scrollTo = (y: number) => {
        if (sc) sc.scrollTop = y;
        else window.scrollTo(0, y);
      };
      if (matches(SHELL_MEDIA.reducedMotion)) {
        scrollTo(to);
        return;
      }
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / SCROLL_MS);
        scrollTo(from + dist * ease(p));
        if (p < 1) scrollRaf.current = requestAnimationFrame(step);
      };
      scrollRaf.current = requestAnimationFrame(step);
    },
    [order],
  );

  const setOpen = React.useCallback(
    (id: string | null) => {
      window.clearTimeout(animTimer.current);
      setAnim(true);
      animTimer.current = window.setTimeout(() => setAnim(false), ANIM_MS);
      setInnerOpen(id);
      notify(id);
      if (id !== null) scrollInStep(id);
    },
    [notify, scrollInStep],
  );

  // Record the open panel's settled size (`--open-panel-w`/`-h`) so the next
  // animation can hold the panel at it instead of laying it out every frame.
  // A board resize with nothing open makes the record stale, so drop it.
  React.useEffect(() => {
    const board = boardRef.current;
    if (!board || anim) return;
    if (openId === null) {
      let first = true;
      const ro = new ResizeObserver(() => {
        if (first) first = false;
        else delete board.dataset.openSize;
      });
      ro.observe(board);
      return () => ro.disconnect();
    }
    const widget = board.querySelector<HTMLElement>(
      '.s2s-widget[data-state="open"]',
    );
    if (!widget) return;
    const ro = new ResizeObserver(() => {
      // On each panel rather than the board: the properties don't inherit (theme-s2s.css),
      // so writing them on the board would leave the panels without them.
      for (const panel of board.querySelectorAll<HTMLElement>(
        ".s2s-widget-full",
      )) {
        panel.style.setProperty("--open-panel-w", `${widget.clientWidth}px`);
        panel.style.setProperty("--open-panel-h", `${widget.clientHeight}px`);
      }
      board.dataset.openSize = "";
    });
    ro.observe(widget);
    return () => ro.disconnect();
  }, [anim, openId]);

  const ctx = React.useMemo(
    () => ({ order, openId, animating: anim, setOpen }),
    [order, openId, anim, setOpen],
  );

  const n = order.length;
  const first = n > 4 ? (firstRow ?? 4) : undefined;
  const openIndex = openId === null ? undefined : order.indexOf(openId);

  return (
    <WidgetBoardContext.Provider value={ctx}>
      <div
        ref={boardRef}
        className={cn("s2s-board", className)}
        data-n={n}
        data-first={first}
        data-open={openIndex}
        data-anim={anim ? "" : undefined}
        {...props}
      >
        {children}
      </div>
    </WidgetBoardContext.Provider>
  );
}

export { WidgetBoard };
export type { WidgetBoardProps };
