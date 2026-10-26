import { $api, client, type ApiSchemas } from "@/lib/api/client";
import { invalidateOrgEvents } from "@/features/org/api/admin-queries";
import {
  ROSTER_LIST_KEY_PREFIX,
  ROSTER_STATS_KEY_PREFIX,
  rosterQueries,
  type RosterEntry,
  type RosterListParams,
} from "@/features/org/api/roster-queries";
import {
  type InfiniteData,
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export type CheckInStatus = ApiSchemas["OrgsIdEventsIdCheckinStatusResponse"];

export const checkInQueries = {
  status: (slug: string, eventId: string) =>
    $api.queryOptions("get", "/orgs/{slug}/events/{id}/check-in/status", {
      params: { path: { slug, id: eventId } },
    }),
  /** A Dancer's pass code, for an organizer to show at the desk (admin only). */
  rosterCode: (slug: string, eventId: string, rosterId: string) =>
    $api.queryOptions(
      "get",
      "/orgs/{slug}/events/{id}/rosters/{rosterId}/check-in-code",
      { params: { path: { slug, id: eventId, rosterId } } },
    ),
};

type RosterResponse = ApiSchemas["OrgsIdEventsIdRostersResponse"];
type StatsResponse = ApiSchemas["OrgsIdEventsIdRostersStatsResponse"];
type CachedRosterList = RosterResponse | InfiniteData<RosterResponse>;
type RosterListKey = readonly [
  "get",
  string,
  { params: { path: { id: string }; query: RosterListParams } },
  ...unknown[],
];

function entriesOf(list: CachedRosterList): RosterEntry[] {
  return "pages" in list ? list.pages.flatMap((page) => page.data) : list.data;
}

/**
 * Writes an entry's new check-in time into every cached roster list, single
 * pages and paged lists alike. A list filtered on `checkedIn` drops the entry
 * once it stops matching; one that lists the newest check-ins first takes it
 * on top. Returns the lists as they were, to roll back, and the entry.
 */
function setCheckedInAt(
  qc: QueryClient,
  rosterId: string,
  checkedInAt: string | null,
) {
  const lists = qc.getQueriesData<CachedRosterList>({
    queryKey: [...ROSTER_LIST_KEY_PREFIX],
  });
  const snapshots: [readonly unknown[], CachedRosterList][] = [];
  const entry = lists
    .flatMap(([, list]) => (list ? entriesOf(list) : []))
    .find((r) => r.id === rosterId);
  if (!entry) return { snapshots, entry };
  const next = { ...entry, checkedInAt };

  for (const [key, list] of lists) {
    if (!list) continue;
    const { path, query } = (key as RosterListKey)[2].params;
    const matches =
      query.checkedIn === undefined || query.checkedIn === !!checkedInAt;
    const listed = entriesOf(list).some((r) => r.id === rosterId);
    const addOnTop =
      matches &&
      !listed &&
      !!checkedInAt &&
      query.checkedIn === true &&
      query.sortBy === "checkedInAt" &&
      query.sortDir === "desc" &&
      !query.search &&
      query.type === entry.type &&
      path.id === entry.eventId;
    if (!listed && !addOnTop) continue;

    snapshots.push([key, list]);
    const delta = addOnTop ? 1 : matches ? 0 : -1;
    const patch = (page: RosterResponse, first: boolean): RosterResponse => {
      const rows = page.data
        .filter((r) => matches || r.id !== rosterId)
        .map((r) => (r.id === rosterId ? next : r));
      return {
        ...page,
        data: first && addOnTop ? [next, ...rows] : rows,
        total: Math.max(0, page.total + delta),
      };
    };
    qc.setQueryData<CachedRosterList>(
      key,
      "pages" in list
        ? { ...list, pages: list.pages.map((page, i) => patch(page, i === 0)) }
        : patch(list, true),
    );
  }
  return { snapshots, entry };
}

export function useDancerCheckIn(slug: string, eventId: string) {
  const qc = useQueryClient();
  const statusKey = checkInQueries.status(slug, eventId).queryKey;

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await client.POST(
        "/orgs/{slug}/events/{id}/check-in",
        { params: { path: { slug, id: eventId } } },
      );
      if (error) throw error;
      return data;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: statusKey });
      const prev = qc.getQueryData<CheckInStatus>(statusKey);
      if (prev) {
        qc.setQueryData<CheckInStatus>(statusKey, {
          ...prev,
          checkedInAt: new Date().toISOString(),
          canCheckIn: false,
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(statusKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: statusKey });
    },
  });
}

/**
 * Turns an event's self check-in on or off. The desk and dashboard read it
 * from the check-in status, so that cache flips at once.
 */
export function useSelfCheckInSetting(slug: string, eventId: string) {
  const qc = useQueryClient();
  const statusKey = checkInQueries.status(slug, eventId).queryKey;

  return useMutation({
    mutationFn: async (selfCheckIn: boolean) => {
      const { data, error } = await client.PATCH("/orgs/{slug}/events/{id}", {
        params: { path: { slug, id: eventId } },
        body: { selfCheckIn },
      });
      if (error) throw error;
      return data;
    },
    onMutate: async (selfCheckIn) => {
      await qc.cancelQueries({ queryKey: statusKey });
      const prev = qc.getQueryData<CheckInStatus>(statusKey);
      if (prev) qc.setQueryData<CheckInStatus>(statusKey, { ...prev, selfCheckIn });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(statusKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: statusKey });
      void invalidateOrgEvents(qc, slug);
    },
  });
}

export function useResetCheckIn() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      eventId,
    }: {
      slug: string;
      eventId: string;
    }) => {
      const { data, error } = await client.POST(
        "/orgs/{slug}/events/{id}/rosters/check-in/reset",
        { params: { path: { slug, id: eventId } } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { slug, eventId }) => {
      qc.invalidateQueries({ queryKey: [...ROSTER_LIST_KEY_PREFIX] });
      qc.invalidateQueries({ queryKey: [...ROSTER_STATS_KEY_PREFIX] });
      qc.invalidateQueries({
        queryKey: checkInQueries.status(slug, eventId).queryKey,
      });
    },
  });
}

export function useAdminCheckInToggle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      eventId,
      rosterId,
    }: {
      slug: string;
      eventId: string;
      rosterId: string;
      currentlyCheckedIn: boolean;
    }) => {
      const { data, error } = await client.POST(
        "/orgs/{slug}/events/{id}/rosters/{rosterId}/check-in",
        { params: { path: { slug, id: eventId, rosterId } } },
      );
      if (error) throw error;
      return data;
    },
    onMutate: async ({ slug, eventId, rosterId, currentlyCheckedIn }) => {
      await qc.cancelQueries({ queryKey: [...ROSTER_LIST_KEY_PREFIX] });
      await qc.cancelQueries({ queryKey: [...ROSTER_STATS_KEY_PREFIX] });

      const { snapshots: rosterSnapshots, entry } = setCheckedInAt(
        qc,
        rosterId,
        currentlyCheckedIn ? null : new Date().toISOString(),
      );
      const statsSnapshots: [readonly unknown[], StatsResponse][] = [];
      const rosterType = entry?.type;

      // Stats are cached per event and roster type; only the toggled entry's
      // count changes. Without the entry in a cached list, onSettled refetches.
      if (rosterType) {
        const statsKey = rosterQueries.stats(
          slug,
          eventId,
          rosterType,
        ).queryKey;
        const stats = qc.getQueryData<StatsResponse>(statsKey);
        if (stats) {
          statsSnapshots.push([statsKey, stats]);
          qc.setQueryData<StatsResponse>(statsKey, {
            ...stats,
            checkedIn: Math.max(
              0,
              stats.checkedIn + (currentlyCheckedIn ? -1 : 1),
            ),
          });
        }
      }

      return { rosterSnapshots, statsSnapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.rosterSnapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      ctx?.statsSnapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [...ROSTER_LIST_KEY_PREFIX] });
      qc.invalidateQueries({ queryKey: [...ROSTER_STATS_KEY_PREFIX] });
    },
  });
}

export type ScanCheckInResponse =
  ApiSchemas["OrgsIdEventsIdCheckinScanResponse"];

/**
 * Checks a Dancer in from the text read off their pass QR. Set-only on the
 * server, so a repeat scan never checks anyone out. The thrown error is the
 * API's `{ message, code, status }` body.
 */
export function useScanCheckIn(slug: string, eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await client.POST(
        "/orgs/{slug}/events/{id}/check-in/scan",
        { params: { path: { slug, id: eventId } }, body: { code } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: ({ result, roster }) => {
      if (result !== "checked_in") return;
      // Show the check-in at once; the invalidations below confirm it.
      setCheckedInAt(qc, roster.id, roster.checkedInAt);
      const statsKey = rosterQueries.stats(slug, eventId, "dancer").queryKey;
      const stats = qc.getQueryData<StatsResponse>(statsKey);
      if (stats) {
        qc.setQueryData<StatsResponse>(statsKey, {
          ...stats,
          checkedIn: Math.min(stats.total, stats.checkedIn + 1),
        });
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [...ROSTER_LIST_KEY_PREFIX] });
      qc.invalidateQueries({ queryKey: [...ROSTER_STATS_KEY_PREFIX] });
      qc.invalidateQueries({
        queryKey: checkInQueries.status(slug, eventId).queryKey,
      });
    },
  });
}
