import { client, type ApiSchemas } from "@/lib/api/client";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export type CheckInStatus = ApiSchemas["OrgsIdEventsIdCheckinStatusResponse"];

export const checkInQueries = {
  status: (slug: string, eventId: string) =>
    queryOptions({
      queryKey: ["orgs", slug, "events", eventId, "check-in", "status"],
      queryFn: () =>
        client
          .GET("/orgs/{slug}/events/{id}/check-in/status", {
            params: { path: { slug, id: eventId } },
          })
          .then((r) => r.data!),
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
      client.POST("/orgs/{slug}/events/{id}/check-in", {
        params: { path: { slug, id: eventId } },
      }),
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

export function useResetCheckIn() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, eventId }: { slug: string; eventId: string }) =>
      client
        .POST("/orgs/{slug}/events/{id}/rosters/check-in/reset", {
          params: { path: { slug, id: eventId } },
        })
        .then((r) => r.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...ROSTER_LIST_KEY_PREFIX] });
      qc.invalidateQueries({ queryKey: [...ROSTER_STATS_KEY_PREFIX] });
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
      client.POST("/orgs/{slug}/events/{id}/rosters/{rosterId}/check-in", {
        params: { path: { slug, id: eventId, rosterId } },
      }),
    onMutate: async ({ rosterId, currentlyCheckedIn }) => {
      await qc.cancelQueries({ queryKey: [...ROSTER_LIST_KEY_PREFIX] });
      await qc.cancelQueries({ queryKey: [...ROSTER_STATS_KEY_PREFIX] });

      type RosterResponse = ApiSchemas["OrgsIdEventsIdRostersResponse"];
      type StatsResponse = ApiSchemas["OrgsIdEventsIdRostersStatsResponse"];

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
