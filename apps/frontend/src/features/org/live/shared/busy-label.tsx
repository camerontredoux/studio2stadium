import { CircleNotchIcon } from "@phosphor-icons/react";

import { Icon } from "@/components/event/icon";
import { cn } from "@/components/utils/cn";

/**
 * A spinning Phosphor glyph and its label ("Saving…"), for buttons and
 * loading rows in the org sheets and dialogs. Replaces the Lucide `Spinner`
 * from `components/ui`, which those views must not render.
 */
function BusyLabel({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <>
      <Icon
        icon={CircleNotchIcon}
        label="Loading"
        className={cn("animate-spin", className)}
      />
      {label}
    </>
  );
}

export { BusyLabel };
