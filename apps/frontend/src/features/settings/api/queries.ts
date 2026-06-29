import { $api } from "@/lib/api/client";

export const accountQueries = {
  account: () => $api.queryOptions("get", "/users/account"),

  usernameAvailable: (username: string) =>
    $api.queryOptions(
      "get",
      "/users/check-availability",
      { params: { query: { username } } },
      {
        enabled: username.length >= 4,
        staleTime: 1000 * 10,
      },
    ),
};
