import { $api } from "@/lib/api/client";

export interface OutboxStat {
  type: string;
  count: number;
}

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
};
