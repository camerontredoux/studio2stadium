import type { FilterValue } from "@/components/shared/filters/types";
import { $api } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

export const exploreQueries = {
  schoolsFilters: () =>
    $api.queryOptions(
      "get",
      "/schools/filters",
      {},
      { staleTime: Infinity, gcTime: Infinity },
    ),
  dancersFilters: () =>
    $api.queryOptions(
      "get",
      "/dancers/filters",
      {},
      { staleTime: Infinity, gcTime: Infinity },
    ),
  schools: (search?: Record<string, FilterValue>) => {
    return $api.queryOptions(
      "get",
      "/schools",
      {
        params: {
          query: {
            ...search,
          },
        },
      },
      {
        staleTime: Infinity,
        gcTime: Infinity,
        placeholderData: keepPreviousData,
      },
    );
  },
  dancers: (search?: Record<string, FilterValue>) => {
    return $api.queryOptions(
      "get",
      "/dancers",
      {
        params: {
          query: {
            ...search,
          },
        },
      },
      {
        staleTime: Infinity,
        gcTime: Infinity,
        placeholderData: keepPreviousData,
      },
    );
  },
};
