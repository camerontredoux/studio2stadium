import { TrayIcon } from "@phosphor-icons/react";

import { Widget } from "@/components/event/shell";
import { Stat } from "@/components/event/stat";
import type { RosterClaim } from "@/features/org/api/roster-claim-queries";

import { shortAge } from "./age";
import { RequestList } from "./request-list";

/**
 * Requests (Main.dc.html L683): sign-ins that didn't match a roster row. Peek: the
 * count "to match" and the two newest emails. Open: every request with "Match"
 * (the Match dialog) and "Dismiss".
 * The dashboard only mounts it while there are requests.
 */
export function RequestsWidget({
  orgSlug,
  eventId,
  claims,
}: {
  orgSlug: string;
  eventId: string;
  /** Pending requests, newest first. */
  claims: RosterClaim[];
}) {
  const count = claims.length;

  return (
    <Widget
      id="requests"
      label="Requests"
      icon={TrayIcon}
      count={count}
      peek={
        <>
          <Stat value={count} caption="to match" />
          <span className="bp-phone:hidden flex flex-col gap-(--space-4)">
            {claims.slice(0, 2).map((claim) => (
              <span
                key={claim.id}
                className="flex min-w-0 items-center gap-(--space-8)"
              >
                <span className="text-fg-2 min-w-0 flex-1 truncate font-mono text-[12px] leading-[1.4]">
                  {claim.requester.email}
                </span>
                <span className="text-fg-3 flex-none font-mono text-[11px] leading-[1.4] tabular-nums">
                  {shortAge(claim.createdAt)}
                </span>
              </span>
            ))}
          </span>
        </>
      }
    >
      <RequestList orgSlug={orgSlug} eventId={eventId} claims={claims} />
    </Widget>
  );
}
