import { $api } from "@/lib/api/client";

export const dancerQueries = {
  settings: {
    profile: () => $api.queryOptions("get", "/dancers/me/profile"),
  },
  profile: (username: string) =>
    $api.queryOptions("get", "/dancers/{username}", {
      params: { path: { username } },
    }),
};
