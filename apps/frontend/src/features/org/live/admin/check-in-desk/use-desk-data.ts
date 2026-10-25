import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { checkInQueries } from "@/features/org/api/check-in-queries";
import {
  type RosterEntry,
  type RosterListParams,
  rosterQueries,
} from "@/features/org/api/roster-queries";

import { countDesk } from "./desk-list";

/** Check-in and roster changes have no realtime broadcast, so the desk polls. */
const POLL_MS = 10_000;

/** The largest page the roster list endpoint accepts (its validator caps `limit` at 200). */
export const DESK_PAGE_SIZE = 200;

function pageParams(page: number): RosterListParams {
  return {
    type: "dancer",
    page,
    limit: DESK_PAGE_SIZE,
    sortBy: "lastName",
    sortDir: "asc",
  };
}

type ListPage = { data?: { data: RosterEntry[] } };

// Module-level so TanStack Query keeps the combined result stable between
// renders while no page changes.
function combinePages(pages: ListPage[]): RosterEntry[] {
  return pages.flatMap((page) => page.data?.data ?? []);
}

/**
 * Every dancer on the event's roster (paged through at 200 a page), the roster
 * stats and the check-in status, all polled every 10s. The list queries share
 * the roster list cache, so `useAdminCheckInToggle`'s optimistic update shows
 * on the desk at once.
 */
export function useDeskData(slug: string, eventId: string) {
  const first = useQuery({
    ...rosterQueries.list(slug, eventId, pageParams(0)),
    refetchInterval: POLL_MS,
  });

  const pageCount = first.data
    ? Math.max(1, Math.ceil(first.data.total / DESK_PAGE_SIZE))
    : 1;

  const restRows = useQueries({
    queries: Array.from({ length: pageCount - 1 }, (_, i) => ({
      ...rosterQueries.list(slug, eventId, pageParams(i + 1)),
      refetchInterval: POLL_MS,
    })),
    combine: combinePages,
  });

  const stats = useQuery({
    ...rosterQueries.stats(slug, eventId, "dancer"),
    refetchInterval: POLL_MS,
  });

  const status = useQuery({
    ...checkInQueries.status(slug, eventId),
    refetchInterval: POLL_MS,
  });

  const dancers = useMemo(() => {
    const seen = new Set<string>();
    const all: RosterEntry[] = [];
    for (const entry of [...(first.data?.data ?? []), ...restRows]) {
      // A dancer added or removed between page fetches can shift a row
      // across a page boundary; keep the first copy.
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      all.push(entry);
    }
    return all;
  }, [first.data, restRows]);

  // The stats endpoint is the source of truth for the totals; until it loads,
  // count the rows we have.
  const listCounts = countDesk(dancers);
  const total = stats.data?.total ?? listCounts.total;
  const checkedIn = stats.data?.checkedIn ?? listCounts.checkedIn;

  return {
    dancers,
    total,
    checkedIn,
    notYet: Math.max(0, total - checkedIn),
    isLoading: first.isPending,
    isError: first.isError,
    status: status.data,
  };
}
