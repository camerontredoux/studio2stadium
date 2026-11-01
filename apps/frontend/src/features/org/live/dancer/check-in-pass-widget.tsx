import { CheckIcon, ClockIcon, QrCodeIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/event/button";
import { CheckInPass } from "@/components/event/check-in-pass";
import { Icon } from "@/components/event/icon";
import { Widget } from "@/components/event/shell";
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import type { OrgEvent } from "@/features/org/api/admin-queries";
import {
  checkInQueries,
  useDancerCheckIn,
} from "@/features/org/api/check-in-queries";
import { useOrg } from "@/features/org/context/use-org";
import { formatCheckInTime } from "@/features/org/live/check-in/check-in-code";
import { useSession } from "@/lib/session";

import { checkInOpensText } from "./check-in-opens";

type CheckInStatus = NonNullable<ReturnType<typeof useCheckInStatus>["status"]>;

/** The status, polled like the old dashboard so "Check-in is open" appears on time. */
function useCheckInStatus(slug: string, eventId: string, enabled: boolean) {
  const query = useQuery({
    ...checkInQueries.status(slug, eventId),
    refetchInterval: 30_000,
    enabled,
  });
  return { status: query.data ?? null, isLoading: query.isLoading };
}

function statusText(
  status: CheckInStatus | null,
  event: Pick<OrgEvent, "timezone" | "effectiveTimezone">,
): string {
  if (status?.checkedInAt)
    return `Checked in · ${formatCheckInTime(
      status.checkedInAt,
      status.timezone ?? event.timezone ?? event.effectiveTimezone,
    )}`;
  return "Not checked in";
}

/**
 * The dancer's Check-in widget: the bib and status on the peek; open, the
 * check-in pass (bib, name, the signed pass code as a QR). On an event with
 * self check-in, a Check in button replaces the QR while check-in is open.
 * The dashboard leaves it out without the `check_in` feature.
 */
export function CheckInPassWidget({
  event,
  id = "check-in",
}: {
  event: OrgEvent;
  id?: string;
}) {
  const { org } = useOrg();
  const { status } = useCheckInStatus(org.slug, event.id, true);
  // The dancer's own bib; null until the organizer assigns one.
  const bib = status?.bibNumber ?? null;
  const checkedIn = !!status?.checkedInAt;

  return (
    <Widget
      id={id}
      label="Check-in"
      icon={QrCodeIcon}
      count={bib ?? undefined}
      peek={
        <>
          <span className="flex items-center gap-(--space-12)">
            <Icon icon={QrCodeIcon} size="xl" className="text-fg-2" />
            {bib !== null && (
              <span className="type-display-stat text-fg font-mono font-medium tabular-nums">
                {bib}
              </span>
            )}
          </span>
          <span
            className={cn(
              "flex min-w-0 items-center gap-(--space-8) text-[12.5px]",
              checkedIn ? "text-event-accent" : "text-fg-3",
            )}
          >
            {checkedIn && <Icon icon={CheckIcon} />}
            <span className="truncate">{statusText(status, event)}</span>
          </span>
        </>
      }
    >
      <PassBody event={event} status={status} bib={bib} />
    </Widget>
  );
}

function PassBody({
  event,
  status,
  bib,
}: {
  event: OrgEvent;
  status: CheckInStatus | null;
  bib: number | null;
}) {
  const { org } = useOrg();
  const session = useSession();
  const checkIn = useDancerCheckIn(org.slug, event.id);
  const name =
    [session.firstName, session.lastName].filter(Boolean).join(" ").trim() ||
    "[Dancer name]";
  const checkedIn = !!status?.checkedInAt;
  const selfCheckInOn = !!status?.selfCheckIn;
  // Self check-in replaces the QR: the desk has no scanner to show it to.
  const code = selfCheckInOn ? null : (status?.checkInCode ?? null);

  const selfCheckIn = () =>
    checkIn.mutate(undefined, {
      onError: () =>
        toastManager.add({
          title: "Check-in failed. Please try again.",
          type: "error",
        }),
      onSuccess: () =>
        toastManager.add({ title: "You're checked in", type: "success" }),
    });

  return (
    <div className="grid min-h-full place-items-center">
      <div className="flex flex-col items-center">
        <CheckInPass
          bib={bib ?? undefined}
          name={name}
          checkedIn={checkedIn}
          status={statusText(status, event)}
          qrValue={code ?? undefined}
          qrLabel={
            bib !== null ? `Check-in code for bib ${bib}` : "Check-in code"
          }
          className={cn(
            // No bib yet: drop the empty bib line's gap.
            bib === null && "[&>span:first-child]:hidden",
            // No signed code (an admin previewing, no Roster Entry, or self check-in): no QR card.
            !code && "[&>div]:hidden",
          )}
        />
        {!checkedIn && selfCheckInOn && status?.canCheckIn && (
          <div className="flex flex-col items-center px-(--space-16) pb-(--space-24)">
            <Button
              variant="primary"
              disabled={checkIn.isPending}
              onClick={selfCheckIn}
            >
              <Icon icon={CheckIcon} />
              {checkIn.isPending ? "Checking in…" : "Check in"}
            </Button>
          </div>
        )}
        {!checkedIn && status && !status.canCheckIn && (
          <span className="type-caption text-fg-3 flex items-center gap-(--space-6) px-(--space-16) pb-(--space-24)">
            <Icon icon={ClockIcon} />
            {checkInOpensText(event, status.eventStartTime, status.timezone)}
          </span>
        )}
      </div>
    </div>
  );
}
