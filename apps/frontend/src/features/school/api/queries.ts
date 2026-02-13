import { $api } from "@/lib/api/client";

export const schoolQueries = {
  profile: (username: string) =>
    $api.queryOptions("get", "/schools/{username}", {
      params: { path: { username } },
    }),
};
