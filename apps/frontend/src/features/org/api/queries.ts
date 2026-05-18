import { $api } from "@/lib/api/client";

export const orgQueries = {
  org: (slug: string) =>
    $api.queryOptions(
      "get",
      "/orgs/{slug}",
      { params: { path: { slug } } },
      { staleTime: 60_000 },
    ),
};
