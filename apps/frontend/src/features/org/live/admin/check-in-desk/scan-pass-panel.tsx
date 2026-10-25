import { useCallback } from "react";

import { Panel, PanelHead } from "@/components/event/panel";
import {
  InlineScanner,
  type ScanOutcome,
} from "@/features/org/live/check-in/inline-scanner";

export interface ScanPassPanelProps {
  slug: string;
  eventId: string;
  /** Called with the scanned dancer's Roster Entry id, so the list can flash the row. */
  onScanned?: (rosterId: string) => void;
  /** A short line under the scanner, e.g. when the event starts. */
  note?: React.ReactNode;
}

/**
 * The desk's "Scan pass" panel: the shared inline scanner at its large size.
 * The camera starts as soon as the desk opens and stops when it closes; every
 * result that names a dancer flashes their row in the list.
 */
export function ScanPassPanel({
  slug,
  eventId,
  onScanned,
  note,
}: ScanPassPanelProps) {
  const handleResult = useCallback(
    (outcome: ScanOutcome) => {
      if ("roster" in outcome) onScanned?.(outcome.roster.id);
    },
    [onScanned],
  );

  return (
    // Square up to 680px tall; the scanner shrinks its viewfinder to fit.
    <Panel aria-label="Scan a pass" className="aspect-square max-h-[680px]">
      <PanelHead label="Scan pass" />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-(--space-14) px-(--space-16) py-(--space-24)">
        <InlineScanner
          slug={slug}
          eventId={eventId}
          active
          size="lg"
          fillHeight
          onResult={handleResult}
        />
        {note ? (
          <p role="status" className="type-caption text-fg-2 text-center">
            {note}
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
