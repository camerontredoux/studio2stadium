import { $api } from "@/lib/api/client";

export const dancerQueries = {
  profile: (username: string) =>
    $api.queryOptions("get", "/dancers/{username}", {
      params: { path: { username } },
    }),
};
