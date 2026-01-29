import { $api } from "@/lib/api/client";
import { mockApi } from "@/lib/mock-api";
import { queryOptions } from "@tanstack/react-query";

export const queries = {
  all: () => ["explore"],
  explore: () =>
    queryOptions({
      queryKey: queries.all(),
      queryFn: () => mockApi.success({ test: 123 }, 5000),
    }),
  filters: () => $api.queryOptions("get", "/schools/filters"),
  // search: (type: AccountType, filters: Record<string, string>) => {
  //   if (type === "dancer") {
  //     return $api.queryOptions("get", "/dancers/search", {
  //       params: { query: filters },
  //     });
  //   }
  //   if (type === "school") {
  //     return $api.queryOptions("get", "/schools/search", {
  //       params: { query: filters },
  //     });
  //   }
  //   throw new Error("Invalid account type");
  // },
};
