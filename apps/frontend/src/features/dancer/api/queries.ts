import { $api } from "@/lib/api/client";

export const dancerQueries = {
  profile: (username: string) =>
    $api.queryOptions("get", "/dancers/{username}", {
      params: { path: { username } },
    }),
  metadata: (id: string, { enabled }: { enabled?: boolean } = {}) =>
    $api.queryOptions(
      "get",
      "/dancers/{id}/metadata",
      {
        params: { path: { id } },
      },
      { enabled },
    ),
  followers: () => $api.queryOptions("get", "/dancers/me/followers"),
  following: () => $api.queryOptions("get", "/dancers/me/following"),
  skills: () => $api.queryOptions("get", "/dancers/me/skills"),
  styles: () => $api.queryOptions("get", "/dancers/me/styles"),
  sports: () => $api.queryOptions("get", "/dancers/me/sports"),
};
