import { $api } from "@/lib/api/client";

export const queries = {
  detail: (username: string) =>
    $api.queryOptions("get", "/dancers/{username}", {
      params: { path: { username } },
    }),
};
