import { $api } from "@/lib/api/client";

export const queries = {
  available: (username: string) => {
    return $api.queryOptions(
      "get",
      "/users/check-availability",
      {
        params: { query: { username } },
      },
      {
        enabled: username.length >= 4,
        staleTime: 1000 * 10,
      },
    );
  },
};
