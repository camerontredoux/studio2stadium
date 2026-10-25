import type * as React from "react";

import { cn } from "@/components/utils/cn";

type LiveBadgeProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** The status word, in the event accent. Default "Live". */
  label?: string;
  /** Current event day (1-based). With `days`, renders "Day 2/3" after the word. */
  day?: number;
  /** Number of event days. */
  days?: number;
  /** The word in the event accent (live). False draws it in fg-2, for an event day outside its hours. Default true. */
  live?: boolean;
};

/**
 * The header's live badge: a 24px badge with the status word in the event accent,
 * followed by the day ("Day 2/3") in fg. Use it exactly as is wherever it appears.
 * On phones the word "Day" drops ("2/3").
 */
function LiveBadge({
  label = "Live",
  day,
  days,
  live = true,
  className,
  ...props
}: LiveBadgeProps) {
  return (
    <span
      className={cn(
        "border-line-control inline-flex h-(--control-sm) shrink-0 items-center gap-(--space-8) rounded-(--radius-5) border px-(--space-8) font-mono text-[11.5px] leading-[1.4] whitespace-nowrap tabular-nums",
        className,
      )}
      {...props}
    >
      <span className={live ? "text-event-accent" : "text-fg-2"}>{label}</span>
      {day !== undefined && days !== undefined && (
        <span className="text-fg">
          <span className="bp-phone:hidden">Day </span>
          {day}/{days}
        </span>
      )}
    </span>
  );
}

export { LiveBadge };
export type { LiveBadgeProps };
