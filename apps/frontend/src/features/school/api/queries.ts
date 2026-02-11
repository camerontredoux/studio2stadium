import { $api } from "@/lib/api/client";
import { mockApi } from "@/lib/mock-api";
import { queryOptions } from "@tanstack/react-query";

export const schoolQueries = {
  settings: {
    profile: () => $api.queryOptions("get", "/schools/me/profile"),
  },
  all: () => ["school"],
  details: (username: string) => [...schoolQueries.all(), username],
  detail: (username: string) =>
    queryOptions({
      queryKey: schoolQueries.details(username),
      queryFn: () => mockApi.success({ username }),
    }),
};
