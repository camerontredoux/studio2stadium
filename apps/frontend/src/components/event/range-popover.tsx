import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import * as React from "react";

import { cn } from "@/components/utils/cn";

// Shared by the date and time range pickers: two chips (Start, End) that open one popup.
//
// The chips are Base UI popover triggers, so clicking the other chip while the popup is open
// switches the active trigger instead of closing and reopening. The popup is anchored to the
// whole field, not to the active chip, and has no Popover.Viewport: the viewport cross-fades a
// DOM clone of the previous trigger's content and the positioner slides between anchors, which
// is what made the old pickers flash an outdated calendar or grid when switching chips.

type RangePhase = "start" | "end";

const rangeChipClass =
  "relative inline-flex h-(--control-sm) min-w-0 flex-1 cursor-pointer items-center justify-center rounded-(--radius-5) border border-line-chip bg-surface-chip px-(--space-8) text-[12.5px] leading-[1.4] text-fg outline-none select-none s2s-focus " +
  "transition-[background-color,border-color] duration-150 ease-(--ease) motion-reduce:transition-none hover:border-line-hover disabled:cursor-not-allowed disabled:opacity-35";

/** The active chip's fill; the sliding `RangeIndicator` draws its border. */
const rangeChipActiveClass = "bg-surface-pressed";

type RangeChipProps = PopoverPrimitive.Trigger.Props & {
  /** Whether this chip's end is the one being picked. */
  active?: boolean;
};

/** A Start or End chip: 24px, `surface-chip`, `radius-5`; `surface-pressed` while active. */
function RangeChip({ active = false, className, ...props }: RangeChipProps) {
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      data-active={active || undefined}
      className={cn(rangeChipClass, active && rangeChipActiveClass, className)}
      {...props}
    />
  );
}

type RangePopupProps = PopoverPrimitive.Popup.Props & {
  /** The whole field (both chips). The popup sits 6px below it, at its width. */
  anchor: React.RefObject<HTMLElement | null>;
};

/** The picker popup: `surface-raised`, `line-control` border, `radius-10`, `shadow-pop`, as wide as the field. */
function RangePopup({
  anchor,
  className,
  children,
  ref,
  ...props
}: RangePopupProps) {
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      popupRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  // Base UI returns focus to the previous trigger whenever the active trigger changes. Here
  // that happens while the popup stays open (Start moves on to End), so focus would jump out
  // of the popup to the Start chip mid-pick. Only return focus once the popup has closed.
  const finalFocus = React.useCallback(
    () => !popupRef.current?.hasAttribute("data-open"),
    [],
  );
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        anchor={anchor}
        side="bottom"
        align="start"
        sideOffset={6}
        className="z-50"
        data-slot="popover-positioner"
      >
        {/* Same open motion as components/ui/popover. */}
        <PopoverPrimitive.Popup
          ref={setRefs}
          data-slot="popover-popup"
          finalFocus={finalFocus}
          className={cn(
            "border-line-control bg-surface-raised text-fg relative w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) rounded-(--radius-10) border shadow-(--shadow-pop) outline-none",
            "transition-[scale,opacity] data-starting-style:scale-98 data-starting-style:opacity-0 motion-reduce:transition-none",
            className,
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

type IndicatorBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: string;
  visible: boolean;
  /** Whether to animate to this box (only when moving between chips). */
  slide: boolean;
};

/**
 * The active-chip highlight: a `line-focus` border that slides from Start to End over 150ms
 * instead of jumping. Render it inside the (relatively positioned) field, after the chips.
 */
function RangeIndicator({
  phase,
  startRef,
  endRef,
}: {
  phase: RangePhase | null;
  startRef: React.RefObject<HTMLElement | null>;
  endRef: React.RefObject<HTMLElement | null>;
}) {
  const [box, setBox] = React.useState<IndicatorBox | null>(null);

  React.useLayoutEffect(() => {
    if (!phase) {
      setBox((prev) =>
        prev ? { ...prev, visible: false, slide: false } : prev,
      );
      return;
    }
    const chip = (phase === "end" ? endRef : startRef).current;
    if (!chip) return;
    const measure = (slide: boolean) =>
      setBox((prev) => ({
        x: chip.offsetLeft,
        y: chip.offsetTop,
        width: chip.offsetWidth,
        height: chip.offsetHeight,
        radius: getComputedStyle(chip).borderRadius,
        visible: true,
        slide: slide && !!prev?.visible,
      }));
    measure(true);
    const field = chip.parentElement;
    if (!field) return;
    const observer = new ResizeObserver(() => measure(false));
    observer.observe(field);
    return () => observer.disconnect();
  }, [phase, startRef, endRef]);

  if (!box) return null;
  return (
    <span
      aria-hidden
      data-slot="range-indicator"
      className={cn(
        "border-line-focus pointer-events-none absolute start-0 top-0 border",
        box.slide
          ? "transition-[translate,width,opacity] duration-150 ease-(--ease)"
          : "transition-opacity duration-150 ease-(--ease)",
        "motion-reduce:transition-none",
        box.visible ? "opacity-100" : "opacity-0",
      )}
      style={{
        translate: `${box.x}px ${box.y}px`,
        width: box.width,
        height: box.height,
        borderRadius: box.radius,
      }}
    />
  );
}

export { RangeChip, RangeIndicator, RangePopup };
export type { RangeChipProps, RangePhase, RangePopupProps };
