import { $api } from "@/lib/api/client";

export const queries = {
  all: () => ["resources"],
  filters: () => $api.queryOptions("get", "/schools/filters"),
  videos: () =>
    $api.queryOptions("get", "/library", {}, { staleTime: 86400000 }),
  videosByCategory: (category: string, page: number) =>
    $api.queryOptions("get", "/library/{category}", {
      params: {
        path: { category },
        query: { page },
      },
    }),
};
