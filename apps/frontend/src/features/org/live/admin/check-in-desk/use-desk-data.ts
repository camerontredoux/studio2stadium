import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { checkInQueries } from "@/features/org/api/check-in-queries";
import {
  ROSTER_LIST_KEY_PREFIX,
  ROSTER_STATS_KEY_PREFIX,
  rosterQueries,
} from "@/features/org/api/roster-queries";
import {
  useTransmitStatus,
  useTransmitSubscription,
} from "@/features/org/hooks/use-transmit";

/** Rows per page of each desk list. */
export const DESK_PAGE_SIZE = 50;

/** Check-ins arrive in bursts at the door; one refetch covers a burst. */
const LIVE_REFRESH_MS = 500;

/**
 * Refetches the roster lists and stats when a check-in changes anywhere: at
 * another desk, by scan, or on a dancer's own pass. Only the pages already
 * loaded refetch. A dropped connection misses broadcasts, so the desk also
 * refetches once it reconnects.
 */
function useLiveCheckIns(slug: string) {
  const qc = useQueryClient();
  const timer = useRef<number | undefined>(undefined);
  const refresh = useCallback(() => {
    if (timer.current !== undefined) return;
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      void qc.invalidateQueries({ queryKey: [...ROSTER_LIST_KEY_PREFIX] });
      void qc.invalidateQueries({ queryKey: [...ROSTER_STATS_KEY_PREFIX] });
    }, LIVE_REFRESH_MS);
  }, [qc]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useTransmitSubscription(`orgs/${slug}/check-in`, refresh);

  const status = useTransmitStatus();
  const dropped = useRef(false);
  useEffect(() => {
    if (status === "disconnected" || status === "reconnecting") {
      dropped.current = true;
    } else if (status === "connected" && dropped.current) {
      dropped.current = false;
      refresh();
    }
  }, [status, refresh]);
}

/**
 * The desk's tally (the roster stats, counted on the server) and the event's
 * check-in status, kept live by `useLiveCheckIns`.
 */
export function useDeskData(slug: string, eventId: string) {
  useLiveCheckIns(slug);
  const stats = useQuery(rosterQueries.stats(slug, eventId, "dancer"));
  const status = useQuery(checkInQueries.status(slug, eventId));

  const total = stats.data?.total ?? 0;
  const checkedIn = stats.data?.checkedIn ?? 0;
  return {
    total,
    checkedIn,
    notYet: Math.max(0, total - checkedIn),
    status: status.data,
  };
}

/**
 * One desk list a page at a time: "Not yet" by name, or "Checked in" newest
 * first. It shares the roster list cache, so `useAdminCheckInToggle`'s
 * optimistic update moves a row between the lists at once.
 */
export function useDeskList(
  slug: string,
  eventId: string,
  {
    checkedIn,
    search,
    enabled,
  }: { checkedIn: boolean; search: string; enabled: boolean },
) {
  const query = useInfiniteQuery({
    ...rosterQueries.listPages(
      slug,
      eventId,
      {
        type: "dancer",
        checkedIn,
        search: search || undefined,
        sortBy: checkedIn ? "checkedInAt" : "lastName",
        sortDir: checkedIn ? "desc" : "asc",
      },
      DESK_PAGE_SIZE,
    ),
    enabled,
    placeholderData: keepPreviousData,
  });
  const pages = query.data?.pages;
  const rows = useMemo(() => {
    const seen = new Set<string>();
    // A check-in between page fetches shifts a row across a page boundary;
    // keep the first copy.
    return (pages ?? [])
      .flatMap((page) => page.data)
      .filter((entry) => !seen.has(entry.id) && !!seen.add(entry.id));
  }, [pages]);
  return { query, rows, total: pages?.[0]?.total ?? 0 };
}
