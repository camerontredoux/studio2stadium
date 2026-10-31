import type * as React from "react";

import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress";
import { cn } from "@/components/utils/cn";

type ProgressBarProps = Omit<
  React.ComponentProps<typeof Progress>,
  "value" | "children" | "min" | "max"
> & {
  /** Progress from 0 to 100. */
  value: number;
  /** Accessible name, e.g. "Dancers activated". */
  label?: string;
  /** Show the mono percentage at the right. Default true. */
  showValue?: boolean;
  /** Percentage in fg and 500 weight, for a totals row. Default false. */
  strong?: boolean;
};

/** A 6px neutral bar with a mono percentage, for activation and check-in progress. */
function ProgressBar({
  value,
  label,
  showValue = true,
  strong = false,
  className,
  ...props
}: ProgressBarProps) {
  return (
    <Progress
      value={value}
      min={0}
      max={100}
      aria-label={label}
      className={cn(
        "flex min-w-0 flex-row items-center gap-(--space-10)",
        className,
      )}
      {...props}
    >
      <ProgressTrack className="bg-track relative h-1.5 min-w-0 flex-1 rounded-(--radius-3)">
        <ProgressIndicator className="bg-fill-bar rounded-(--radius-3)" />
      </ProgressTrack>
      {showValue && (
        <ProgressValue
          className={cn(
            "type-meta w-8 shrink-0 text-right",
            strong ? "text-fg font-medium" : "text-fg-2",
          )}
        />
      )}
    </Progress>
  );
}

export { ProgressBar };
export type { ProgressBarProps };
