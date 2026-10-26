import type * as React from "react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/components/utils/cn";

type DayProgressProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Current event day, 1-based. */
  day: number;
  /** Number of event days. */
  days: number;
  /** How far through today, 0 to 100. */
  pct: number;
  /** One label per day, e.g. "Thu 23". */
  labels: readonly string[];
  /** Time left today, shown top right in mono fg-2, e.g. "3h 20m left". */
  left?: React.ReactNode;
  /** The status tag. Default "Live". */
  status?: string;
  /** The tag in the event accent (live). False draws it in fg-2, for an event day outside its hours. Default true. */
  live?: boolean;
};

/** The event's place in time for the top of the rail: Live tag, "Day 2 of 3" and one segment per day. */
function DayProgress({
  day,
  days,
  pct,
  labels,
  left,
  status = "Live",
  live = true,
  className,
  ...props
}: DayProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div
      className={cn("flex flex-col gap-(--space-12) p-(--space-14)", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "type-label border-line-control rounded-(--radius-4) border px-(--space-6) py-(--space-2)",
            live ? "text-event-accent" : "text-fg-2",
          )}
        >
          {status}
        </span>
        {left !== undefined && (
          <span className="type-data-sm text-fg-2">{left}</span>
        )}
      </div>
      <div className="flex items-baseline gap-(--space-8) tabular-nums">
        <span className="type-display-day text-fg">Day {day}</span>
        <span className="text-fg-3 text-[14px] leading-[1.4] font-medium">
          of {days}
        </span>
      </div>
      <Progress
        value={clamped}
        min={0}
        max={100}
        aria-label="Event progress"
        getAriaValueText={() =>
          `Day ${day} of ${days}, ${clamped}% through today`
        }
        className="flex flex-row gap-(--space-4)"
      >
        {Array.from({ length: days }, (_, index) => {
          const n = index + 1;
          return (
            <div
              key={n}
              className="flex min-w-0 flex-1 flex-col gap-(--space-8)"
            >
              <span
                className={cn(
                  "block h-[10px] rounded-(--radius-3)",
                  n < day && "bg-fill-done",
                  n === day &&
                    "bg-[linear-gradient(to_right,var(--event-accent)_var(--dp-pct),var(--track-upcoming)_var(--dp-pct))]",
                  n > day && "bg-track-upcoming",
                )}
                style={
                  n === day
                    ? ({ "--dp-pct": `${clamped}%` } as React.CSSProperties)
                    : undefined
                }
              />
              <span
                className={cn(
                  "type-meta truncate",
                  n === day ? "text-fg" : "text-fg-3",
                )}
              >
                {labels[index]}
              </span>
            </div>
          );
        })}
      </Progress>
    </div>
  );
}

export { DayProgress };
export type { DayProgressProps };
