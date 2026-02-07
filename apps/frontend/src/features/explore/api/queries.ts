import type { FilterValue } from "@/components/shared/filters/types";
import { $api } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

export const queries = {
  all: () => ["explore"],
  filters: () =>
    $api.queryOptions(
      "get",
      "/schools/filters",
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
};
