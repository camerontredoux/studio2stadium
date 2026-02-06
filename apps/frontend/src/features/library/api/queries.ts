import { $api } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

export const queries = {
  all: () => ["resources"],
  filters: () => $api.queryOptions("get", "/schools/filters"),
  videos: () =>
    $api.queryOptions("get", "/library", {}, { staleTime: 86400000 }),
};

export function useVideosByCategory(category: string, enabled: boolean) {
  return $api.useInfiniteQuery(
    "get",
    "/library/{category}",
    {
      params: {
        path: { category },
        query: { page: 1 },
      },
    },
    {
      placeholderData: keepPreviousData,
      getNextPageParam: (lastPage, _, lastPageParam) =>
        lastPage.length < 6 ? undefined : (lastPageParam as number) + 1,
      initialPageParam: 2,
      pageParamName: "page",
      enabled,
    },
  );
}
