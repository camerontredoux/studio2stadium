import { CheckIcon, HandTapIcon } from "@phosphor-icons/react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { toastManager } from "@/components/ui/toast-manager";
import { useSelfCheckInSetting } from "@/features/org/api/check-in-queries";

export interface SelfCheckInButtonProps {
  slug: string;
  eventId: string;
  /** The event's self check-in setting; undefined until the status loads. */
  selfCheckIn: boolean | undefined;
  /** `sm` in tile heads, `md` in panel heads. */
  size?: "sm" | "md";
}

/**
 * Turns the event's Self check-in on and off, on the check-in desk and in the
 * dashboard Check-in widget's head. The label names the current state;
 * aria-pressed carries it too. The status cache flips at once and rolls back
 * if the save fails.
 */
export function SelfCheckInButton({
  slug,
  eventId,
  selfCheckIn,
  size = "md",
}: SelfCheckInButtonProps) {
  const setting = useSelfCheckInSetting(slug, eventId);

  const toggle = () => {
    const next = !selfCheckIn;
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
    <Button
      variant="primary"
      size={size}
      aria-pressed={!!selfCheckIn}
      disabled={selfCheckIn === undefined || setting.isPending}
      onClick={toggle}
    >
      <Icon icon={selfCheckIn ? CheckIcon : HandTapIcon} />
      {selfCheckIn ? "Self check-in on" : "Allow self check-in"}
    </Button>
  );
}
