import { $api } from "@/lib/api/client";

export const sportQueries = {
  all: () =>
    $api.queryOptions(
      "get",
      "/sports",
      {},
      { gcTime: Infinity, staleTime: Infinity },
    ),
};
