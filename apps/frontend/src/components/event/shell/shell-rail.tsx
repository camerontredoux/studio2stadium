import type * as React from "react";

import { cn } from "@/components/utils/cn";

type ShellRailProps = React.ComponentProps<"aside">;

/**
 * The 300px right rail. Sticks beside the widgets above 1000px and wraps below them at
 * 1000px and under. Fill it with `RailSection`s.
 */
function ShellRail({ className, ...props }: ShellRailProps) {
  return (
    <aside
      aria-label="Event"
      className={cn("s2s-rail", className)}
      {...props}
    />
  );
}

type RailSectionProps = React.ComponentProps<"div"> & {
  /**
   * The event card (Live, time left, day segments). Hidden at 1000px and under, where the
   * header shows the status instead.
   */
  event?: boolean;
};

/** One block of the rail, separated from the next by a line. */
function RailSection({ event = false, className, ...props }: RailSectionProps) {
  return (
    <div
      className={cn("s2s-rail-sec", event && "s2s-rail-event", className)}
      {...props}
    />
  );
}

export { RailSection, ShellRail };
export type { RailSectionProps, ShellRailProps };
