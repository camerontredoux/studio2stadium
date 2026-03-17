import { $api } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

export const adminQueries = {
  applications: () => $api.queryOptions("get", "/admin/applications"),
  schools: () => $api.queryOptions("get", "/admin/schools"),
  schoolEvents: (username: string) =>
    $api.queryOptions("get", "/schools/{username}", {
      params: { path: { username } },
    }),
  dancers: (search: { page?: number; limit?: number }) =>
    $api.queryOptions(
      "get",
      "/admin/dancers",
      {
        params: {
          query: {
            page: search.page ?? 0,
            limit: search.limit ?? 10,
          },
        },
      },
      {
        placeholderData: keepPreviousData,
      },
    ),
};
