import type { FilterValue } from "@/components/shared/filters/types";
import { $api } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

export const eventQueries = {
  filters: () =>
    $api.queryOptions(
      "get",
      "/events/filters",
      {},
      { staleTime: Infinity, gcTime: Infinity },
    ),
  events: (search?: Record<string, FilterValue>) =>
    $api.queryOptions(
      "get",
      "/events",
      {
        params: {
          query: {
            ...search,
          },
        },
      },
      {
        placeholderData: keepPreviousData,
      },
    ),
  upcoming: () => $api.queryOptions("get", "/events/upcoming"),
  globalEvents: () => $api.queryOptions("get", "/events/global"),
  upcomingGlobalEvents: () =>
    $api.queryOptions("get", "/events/global/upcoming"),
  event: (id: string) =>
    $api.queryOptions("get", "/events/{id}", {
      params: { path: { id } },
    }),
};
