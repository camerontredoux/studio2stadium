import { $api } from "@/lib/api/client";
import type { components } from "@/lib/api/types";

export interface OutboxStat {
  type: string;
  count: number;
}

export type OutboxStatsHistory =
  components["schemas"]["AdminOutboxStatsHistoryResponse"];

export type PeriodStats = Record<
  string,
  { current: number; previous: number; change: number | null }
>;

export const outboxStatsQueries = {
  stats: () =>
    $api.queryOptions("get", "/admin/outbox/stats", undefined, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: (data: any): OutboxStat[] => {
        // Handle both array response and object with stats property
        if (Array.isArray(data)) {
          return data;
        }
        if (data?.stats && Array.isArray(data.stats)) {
          return data.stats;
        }
        // If it's an object with type keys and count values, convert it
        if (data && typeof data === "object") {
          return Object.entries(data).map(([type, count]) => ({
            type,
            count: count as number,
          }));
        }
        return [];
      },
    }),

  history: () => $api.queryOptions("get", "/admin/outbox/stats/history"),
};
