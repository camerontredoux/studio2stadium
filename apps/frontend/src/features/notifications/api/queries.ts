import { $api, client } from "@/lib/api/client";
import { infiniteQueryOptions } from "@tanstack/react-query";

export const notificationQueries = {
  notifications: () =>
    infiniteQueryOptions({
      queryKey: ["get", "/notifications"] as const,
      queryFn: async ({ pageParam }) => {
        const { data, error } = await client.GET("/notifications", {
          params: { query: { cursor: pageParam } },
        });
        if (error) throw error;
        return data!;
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialPageParam: undefined as string | undefined,
    }),
  count: () => $api.queryOptions("get", "/notifications/count"),
};
