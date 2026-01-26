import { $api } from "@/lib/api/client";

export const queries = {
  all: () => ["signup"] as const,
  availability: (username: string) => [...queries.all(), username],
  available: (username: string) => {
    return $api.queryOptions(
      "get",
      "/auth/username-available",
      {
        params: { query: { username } },
      },
      { enabled: !!username, staleTime: 0, gcTime: 0 },
    );
  },
};
