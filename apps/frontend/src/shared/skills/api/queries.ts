import { $api } from "@/lib/api/client";

export const skillQueries = {
  all: () =>
    $api.queryOptions(
      "get",
      "/skills",
      {},
      { gcTime: Infinity, staleTime: Infinity },
    ),
};
