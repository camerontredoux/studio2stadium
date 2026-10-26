import { Switch } from "@/components/ui/switch";
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import { useSelfCheckInSetting } from "@/features/org/api/check-in-queries";

export interface SelfCheckInToggleProps {
  slug: string;
  eventId: string;
  /** The event's self check-in setting; undefined until the status loads. */
  selfCheckIn: boolean | undefined;
  className?: string;
}

/**
 * Turns the event's Self check-in on and off, on the check-in desk and in the
 * dashboard Check-in widget's head: a switch and its label in a small bordered
 * pill, in the event accent while on. The status cache flips at once and rolls
 * back if the save fails.
 */
export function SelfCheckInToggle({
  slug,
  eventId,
  selfCheckIn,
  className,
}: SelfCheckInToggleProps) {
  const setting = useSelfCheckInSetting(slug, eventId);
  const on = !!selfCheckIn;
  // Off until the status loads. A save in flight ignores further flips rather
  // than dimming the pill each time.
  const disabled = selfCheckIn === undefined;

  const onCheckedChange = (next: boolean) => {
    if (setting.isPending) return;
    setting.mutate(next, {
      onError: () =>
        toastManager.add({
          title: next
            ? "Couldn’t turn on self check-in"
            : "Couldn’t turn off self check-in",
          type: "error",
        }),
    });
  };

  return (
    // The label wraps the switch, so the whole pill toggles it.
    <label
      data-testid="self-check-in-toggle"
      className={cn(
        "border-line-control bg-surface-raised inline-flex h-[26px] shrink-0 cursor-pointer items-center gap-(--space-6) rounded-(--radius-pill) border ps-[3px] pe-(--space-10) text-[12.5px] font-medium whitespace-nowrap",
        on ? "text-event-accent" : "text-fg-2",
        disabled && "cursor-default opacity-35",
        className,
      )}
    >
      <Switch
        checked={on}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="data-checked:bg-event-accent s2s-focus focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      Self check-in
    </label>
  );
}
