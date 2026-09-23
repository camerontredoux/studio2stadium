import type { ComponentProps } from "react";
import { cn } from "@/components/utils/cn";

/**
 * A single-row filter/search toolbar that scrolls horizontally when its
 * controls do not fit, instead of wrapping or clipping them.
 *
 * Direct children never shrink, so a search input keeps its own min width
 * and selects keep their labels. Put the row's padding on this element: the
 * scroll container clips overflow on both axes, and the padding keeps focus
 * rings visible. Select and popover content portals out of the container.
 */
export function ScrollableFilterBar({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="scrollable-filter-bar"
      className={cn(
        "scrollbar-none flex flex-nowrap items-center overflow-x-auto overscroll-x-contain *:shrink-0",
        className,
      )}
      {...props}
    />
  );
}
