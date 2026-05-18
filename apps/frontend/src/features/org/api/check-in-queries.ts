import { client } from "@/lib/api/client";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

const rawClient = client as unknown as {
  POST: (
    path: string,
    opts?: { body?: unknown },
  ) => Promise<{ data: unknown }>;
  GET: (path: string) => Promise<{ data: unknown }>;
};

export type CheckInStatus = {
  checkedInAt: string | null;
  eventStartTime: string | null;
  timezone: string | null;
  canCheckIn: boolean;
};

export const checkInQueries = {
  status: (slug: string, eventId: string) =>
    queryOptions({
      queryKey: ["orgs", slug, "events", eventId, "check-in", "status"],
      queryFn: () =>
        rawClient
          .GET(`/orgs/${slug}/events/${eventId}/check-in/status`)
          .then((r) => r.data as CheckInStatus),
    }),
};

const ROSTER_LIST_KEY_PREFIX = [
  "get",
  "/orgs/{slug}/events/{id}/rosters",
] as const;
const ROSTER_STATS_KEY_PREFIX = [
  "get",
  "/orgs/{slug}/events/{id}/rosters/stats",
] as const;

export function useDancerCheckIn(slug: string, eventId: string) {
  const qc = useQueryClient();
  const statusKey = checkInQueries.status(slug, eventId).queryKey;

  return useMutation({
    mutationFn: () =>
      rawClient.POST(`/orgs/${slug}/events/${eventId}/check-in`),
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

export function useAdminCheckInToggle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      slug,
      eventId,
      rosterId,
    }: {
      slug: string;
      eventId: string;
      rosterId: string;
      currentlyCheckedIn: boolean;
    }) =>
      rawClient.POST(
        `/orgs/${slug}/events/${eventId}/rosters/${rosterId}/check-in`,
      ),
    onMutate: async ({ rosterId, currentlyCheckedIn }) => {
      await qc.cancelQueries({ queryKey: [...ROSTER_LIST_KEY_PREFIX] });
      await qc.cancelQueries({ queryKey: [...ROSTER_STATS_KEY_PREFIX] });

      type RosterResponse = {
        data: { id: string; checkedInAt: string | null }[];
        total: number;
      };
      type StatsResponse = {
        total: number;
        active: number;
        pending: number;
        checkedIn: number;
      };

      const rosterSnapshots: [readonly unknown[], RosterResponse][] = [];
      const statsSnapshots: [readonly unknown[], StatsResponse][] = [];

      qc.getQueriesData<RosterResponse>({
        queryKey: [...ROSTER_LIST_KEY_PREFIX],
      }).forEach(([key, data]) => {
        if (!data) return;
        rosterSnapshots.push([key, data]);
        qc.setQueryData(key, {
          ...data,
          data: data.data.map((r) =>
            r.id === rosterId
              ? {
                  ...r,
                  checkedInAt: currentlyCheckedIn
                    ? null
                    : new Date().toISOString(),
                }
              : r,
          ),
        });
      });

      const delta = currentlyCheckedIn ? -1 : 1;
      qc.getQueriesData<StatsResponse>({
        queryKey: [...ROSTER_STATS_KEY_PREFIX],
      }).forEach(([key, data]) => {
        if (!data) return;
        statsSnapshots.push([key, data]);
        qc.setQueryData(key, {
          ...data,
          checkedIn: Math.max(0, data.checkedIn + delta),
        });
      });

      return { rosterSnapshots, statsSnapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.rosterSnapshots.forEach(([key, data]) =>
        qc.setQueryData(key, data),
      );
      ctx?.statsSnapshots.forEach(([key, data]) =>
        qc.setQueryData(key, data),
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [...ROSTER_LIST_KEY_PREFIX] });
      qc.invalidateQueries({ queryKey: [...ROSTER_STATS_KEY_PREFIX] });
    },
  });
}
