import { mockApi } from "@/lib/mock-api";
import { queryOptions } from "@tanstack/react-query";

export const queries = {
  all: () => ["school"],
  details: (username: string) => [...queries.all(), username],
  detail: (username: string) =>
    queryOptions({
      queryKey: queries.details(username),
      queryFn: () => mockApi.success({ username }),
    }),
};
