import {
  ArrowSquareOutIcon,
  ArrowsInSimpleIcon,
  ArrowsOutSimpleIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import * as React from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import {
  useWidgetBoardSlot,
  type WidgetState,
} from "@/components/event/shell/widget-board-context";
import { cn } from "@/components/utils/cn";

type TileProps = Omit<React.ComponentProps<"section">, "children"> & {
  /** Must appear in the surrounding `WidgetBoard`'s `order`. */
  id: string;
  /** Sentence case; shown as the mono label. */
  label: string;
  /** Strip icon (Phosphor component, 16px). */
  icon: PhosphorIcon;
  /** Mono count on the strip and beside the open head's label. */
  count?: React.ReactNode;
  /** A small mark right after the label on the peek and open heads (e.g. a connection status icon). */
  labelAddon?: React.ReactNode;
  /** Peek content pinned to the bottom (usually a `Stat` plus a line or two). No buttons inside: the whole peek is a button. */
  peek?: React.ReactNode;
  /** Decoration behind the peek, e.g. the blurred schedule page (`s2s-doc-bg`). */
  peekBackground?: React.ReactNode;
  /**
   * Commands in the open head, before the full-page link and the collapse
   * button. Keep them alike across widgets: `<Button size="sm">` (secondary)
   * with an icon and a label, or `size="sm" variant="ghost" iconOnly` for a
   * minor one such as Remove.
   */
  actions?: React.ReactNode;
  /**
   * The widget's full page, as a link element for `render` (e.g. a router
   * `<Link>`). The head shows it as the standard "Full page" button.
   */
  fullPage?: React.ReactElement;
  /** The open body; it scrolls. */
  children?: React.ReactNode;
  /** Outside a `WidgetBoard` only: the state and handlers. */
  state?: WidgetState;
  onOpen?: () => void;
  onCollapse?: () => void;
};

/**
 * A dashboard widget in three stacked layers that crossfade: a square peek, a 44px folded
 * strip and the open panel. Inside a `WidgetBoard` it takes its state from the board.
 */
function Tile({
  id,
  label,
  icon,
  count,
  labelAddon,
  peek,
  peekBackground,
  actions,
  fullPage,
  children,
  state: stateProp,
  onOpen,
  onCollapse,
  className,
  style,
  ...props
}: TileProps) {
  const slot = useWidgetBoardSlot(id);
  const state = slot?.state ?? stateProp ?? "peek";
  const open = slot?.open ?? onOpen;
  const collapse = slot?.collapse ?? onCollapse;
  const rootRef = React.useRef<HTMLElement>(null);
  const peekRef = React.useRef<HTMLButtonElement>(null);
  const collapseRef = React.useRef<HTMLButtonElement>(null);
  const prevState = React.useRef(state);
  // Whether the last open or collapse came from the keyboard. A click opens
  // without moving focus, so the collapse button doesn't show a focus ring.
  const byKeyboard = React.useRef(false);
  const openFrom = (event: React.MouseEvent) => {
    byKeyboard.current = event.detail === 0;
    open?.();
  };
  const collapseFrom = (event: React.MouseEvent) => {
    byKeyboard.current = event.detail === 0;
    collapse?.();
  };

  // Keep focus on this widget when its own layer swaps out from under it.
  React.useEffect(() => {
    const was = prevState.current;
    prevState.current = state;
    if (was === state || !byKeyboard.current) return;
    const root = rootRef.current;
    const active = document.activeElement;
    if (!root || !(active === document.body || root.contains(active))) return;
    if (state === "open") collapseRef.current?.focus({ preventScroll: true });
    else if (state === "peek" && was === "open")
      peekRef.current?.focus({ preventScroll: true });
  }, [state]);

  if (slot && slot.index < 0) {
    if (import.meta.env.DEV)
      console.warn(`Tile "${id}" is not in its WidgetBoard's order.`);
    return null;
  }

  const lower = label.toLowerCase();

  return (
    <section
      ref={rootRef}
      aria-label={label}
      className={cn("s2s-widget", className)}
      data-state={state}
      data-index={slot?.index}
      style={slot ? { order: slot.index, ...style } : style}
      {...props}
    >
      <button
        ref={peekRef}
        type="button"
        className="s2s-widget-layer s2s-widget-peek"
        aria-label={`Expand ${lower}`}
        onClick={openFrom}
      >
        {peekBackground}
        <span className="s2s-widget-head">
          <span className="s2s-widget-label type-label">{label}</span>
          {labelAddon}
          <span className="s2s-widget-exp">
            <Icon icon={ArrowsOutSimpleIcon} />
          </span>
        </span>
        <span className="s2s-widget-pbody">{peek}</span>
      </button>
      <button
        type="button"
        className="s2s-widget-layer s2s-widget-strip"
        aria-label={`Open ${lower}`}
        onClick={openFrom}
      >
        <Icon icon={icon} size="md" />
        {count !== undefined && (
          <span className="s2s-widget-strip-count">{count}</span>
        )}
        <span className="s2s-widget-strip-label">{label}</span>
      </button>
      <div className="s2s-widget-layer s2s-widget-full">
        {/* The whole head collapses on click, like the mockup; the button is the keyboard path. */}
        <div
          className="s2s-widget-fhead"
          title="Collapse"
          onClick={collapseFrom}
        >
          <h2 className="s2s-widget-label type-label m-0">{label}</h2>
          {labelAddon}
          {count !== undefined && (
            <span className="s2s-widget-fcount">{count}</span>
          )}
          <div
            className="s2s-widget-factions"
            onClick={(event) => event.stopPropagation()}
          >
            {actions}
            {fullPage && (
              // A square icon button on phones, so the head keeps room for the title.
              <Button
                size="sm"
                variant="ghost"
                render={fullPage}
                title="Full page"
                className="bp-phone:w-(--control-sm) bp-phone:px-0"
              >
                <Icon icon={ArrowSquareOutIcon} />
                <span className="bp-phone:sr-only">Full page</span>
              </Button>
            )}
            <Button
              ref={collapseRef}
              size="sm"
              iconOnly
              variant="ghost"
              label={`Collapse ${lower}`}
              title="Collapse"
              onClick={collapseFrom}
            >
              <Icon icon={ArrowsInSimpleIcon} />
            </Button>
          </div>
        </div>
        <div className="s2s-widget-fbody">{children}</div>
      </div>
    </section>
  );
}

export { Tile };
export type { TileProps };
