import { HandTapIcon } from "@phosphor-icons/react";

import { Icon } from "@/components/event/icon";

/** Shown in place of the scanner while an event has self check-in on. */
export function SelfCheckInNotice() {
  return (
    <div
      data-testid="self-check-in-notice"
      className="flex max-w-[280px] flex-col items-center gap-(--space-8) text-center"
    >
      <Icon icon={HandTapIcon} size="xl" className="text-fg-2" />
      <p className="type-body-strong text-fg">
        Dancers can check themselves in
      </p>
      <p className="type-caption text-fg-3">
        They tap Check in on their dashboard. Turn off Self check-in to scan
        passes instead.
      </p>
    </div>
  );
}
