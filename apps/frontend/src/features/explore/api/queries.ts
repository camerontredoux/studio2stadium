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
  schools: (search: { [x: string]: string | string[] | undefined }) => {
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
