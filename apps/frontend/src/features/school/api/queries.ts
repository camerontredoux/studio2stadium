import { $api } from "@/lib/api/client";

export const schoolQueries = {
  profile: (username: string) =>
    $api.queryOptions("get", "/schools/{username}", {
      params: { path: { username } },
    }),
  metadata: (id: string, { enabled }: { enabled?: boolean } = {}) =>
    $api.queryOptions(
      "get",
      "/schools/{id}/metadata",
      {
        params: { path: { id } },
      },
      { enabled },
    ),
  followers: () => $api.queryOptions("get", "/schools/me/followers"),
  following: () => $api.queryOptions("get", "/schools/me/following"),
  skills: () => $api.queryOptions("get", "/schools/me/skills"),
};
