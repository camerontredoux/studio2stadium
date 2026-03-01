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

  schoolAvailable: (schoolName: string) => {
    return $api.queryOptions(
      "get",
      "/schools/check-availability",
      {
        params: { query: { schoolName } },
      },
      {
        enabled: schoolName.length >= 2,
        staleTime: 1000 * 10,
      },
    );
  },
};
