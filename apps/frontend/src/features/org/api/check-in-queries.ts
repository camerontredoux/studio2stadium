import { $api, client, type ApiSchemas } from "@/lib/api/client";
import {
  rosterQueries,
  type RosterType,
} from "@/features/org/api/roster-queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type CheckInStatus = ApiSchemas["OrgsIdEventsIdCheckinStatusResponse"];

export const checkInQueries = {
  status: (slug: string, eventId: string) =>
    $api.queryOptions("get", "/orgs/{slug}/events/{id}/check-in/status", {
      params: { path: { slug, id: eventId } },
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

      type RosterResponse = ApiSchemas["OrgsIdEventsIdRostersResponse"];
      type StatsResponse = ApiSchemas["OrgsIdEventsIdRostersStatsResponse"];

      const rosterSnapshots: [readonly unknown[], RosterResponse][] = [];
      const statsSnapshots: [readonly unknown[], StatsResponse][] = [];
      let rosterType: RosterType | undefined;

      qc.getQueriesData<RosterResponse>({
        queryKey: [...ROSTER_LIST_KEY_PREFIX],
      }).forEach(([key, data]) => {
        if (!data) return;
        rosterSnapshots.push([key, data]);
        rosterType ??= data.data.find((r) => r.id === rosterId)?.type;
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
