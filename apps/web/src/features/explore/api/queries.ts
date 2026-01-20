import { mockApi } from "@/lib/mock-api";
import { queryOptions } from "@tanstack/react-query";

export const queries = {
  all: () => ["explore"],
  explore: () =>
    queryOptions({
      queryKey: queries.all(),
      queryFn: () => mockApi.success({ test: 123 }),
    }),
};
