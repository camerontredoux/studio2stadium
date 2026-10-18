import { $api, type ApiSchemas } from "@/lib/api/client";

export type PublicOrg = ApiSchemas["OrgsResponse"][number];

export const publicOrgsQueries = {
  list: () =>
    $api.queryOptions("get", "/orgs", undefined, { staleTime: 60_000 }),
};
