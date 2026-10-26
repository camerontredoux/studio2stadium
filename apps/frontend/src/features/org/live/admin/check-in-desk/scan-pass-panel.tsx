import { useCallback } from "react";
import { CheckIcon, HandTapIcon } from "@phosphor-icons/react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { Panel, PanelHead } from "@/components/event/panel";
import { toastManager } from "@/components/ui/toast-manager";
import { useSelfCheckInSetting } from "@/features/org/api/check-in-queries";
import {
  InlineScanner,
  type ScanOutcome,
} from "@/features/org/live/check-in/inline-scanner";
import { SelfCheckInNotice } from "@/features/org/live/check-in/self-check-in-notice";

export interface ScanPassPanelProps {
  slug: string;
  eventId: string;
  /** The event's self check-in setting; undefined until the status loads. */
  selfCheckIn: boolean | undefined;
  /** Called with the scanned dancer's Roster Entry id, so the list can flash the row. */
  onScanned?: (rosterId: string) => void;
  /** A short line under the scanner, e.g. when the event starts. */
  note?: React.ReactNode;
}

/**
 * The desk's "Scan pass" panel: the shared inline scanner at its large size,
 * and the button that turns the event's Self check-in on and off. The camera starts as soon as the desk
 * opens and stops when it closes; every result that names a dancer flashes
 * their row in the list. With self check-in on there is no camera, only a
 * note that dancers check themselves in.
 */
export function ScanPassPanel({
  slug,
  eventId,
  selfCheckIn,
  onScanned,
  note,
}: ScanPassPanelProps) {
  const setting = useSelfCheckInSetting(slug, eventId);
  const handleResult = useCallback(
    (outcome: ScanOutcome) => {
      if ("roster" in outcome) onScanned?.(outcome.roster.id);
    },
    [onScanned],
  );

  const toggleSelfCheckIn = () => {
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
    // Square up to 680px tall; the scanner shrinks its viewfinder to fit.
    <Panel aria-label="Scan a pass" className="aspect-square max-h-[680px]">
      <PanelHead
        label="Scan pass"
        actions={
          // The label names the current state; aria-pressed carries it too.
          <Button
            variant="primary"
            aria-pressed={!!selfCheckIn}
            disabled={selfCheckIn === undefined || setting.isPending}
            onClick={toggleSelfCheckIn}
          >
            <Icon icon={selfCheckIn ? CheckIcon : HandTapIcon} />
            {selfCheckIn ? "Self check-in on" : "Allow self check-in"}
          </Button>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-(--space-14) px-(--space-16) py-(--space-24)">
        {selfCheckIn ? (
          <SelfCheckInNotice />
        ) : (
          selfCheckIn === false && (
            <InlineScanner
              slug={slug}
              eventId={eventId}
              active
              size="lg"
              fillHeight
              onResult={handleResult}
            />
          )
        )}
        {note ? (
          <p role="status" className="type-caption text-fg-2 text-center">
            {note}
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
