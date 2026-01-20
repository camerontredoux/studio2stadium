import { mockApi } from "@/lib/mock-api";
import { queryOptions } from "@tanstack/react-query";

export const queries = {
  all: () => ["dancer"],
  dancers: (username: string) => [...queries.all(), username],
  dancer: (username: string) =>
    queryOptions({
      queryKey: queries.dancers(username),
      queryFn: () => mockApi.success({ username }),
    }),
};
