import { $api } from "@/lib/api/client";

export const styleQueries = {
  all: () =>
    $api.queryOptions(
      "get",
      "/styles",
      {},
      { gcTime: Infinity, staleTime: Infinity },
    ),
};
