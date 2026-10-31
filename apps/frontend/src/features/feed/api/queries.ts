import { $api, client } from "@/lib/api/client";
import { infiniteQueryOptions } from "@tanstack/react-query";

export const feedQueries = {
  feed: () =>
    infiniteQueryOptions({
      queryKey: ["get", "/feed"],
      queryFn: async ({ pageParam }) => {
        const { data, error } = await client.GET("/feed", {
          params: { query: { cursor: pageParam } },
        });
        if (error) throw error;
        return data;
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: undefined as string | undefined,
    }),
  recommended: () =>
    $api.queryOptions("get", "/schools/recommended", {
      params: { query: { limit: 20 } },
    }),
  recommendedDancers: () =>
    $api.queryOptions("get", "/dancers/recommended", {
      params: { query: { limit: 20 } },
    }),
};
