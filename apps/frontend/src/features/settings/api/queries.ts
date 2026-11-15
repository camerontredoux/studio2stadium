import { $api } from "@/lib/api/client";
import type { components } from "@/lib/api/types";

type SwitchablePlan = components["schemas"]["SubscriptionPlan"];

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

  /**
   * What switching to `plan` costs. Never cached: the amounts move by the
   * second, and confirming charges what was shown last.
   */
  planChange: (plan: SwitchablePlan | null) =>
    $api.queryOptions(
      "get",
      "/subscriptions/change-plan",
      { params: { query: { plan: plan ?? "monthly" } } },
      { enabled: plan !== null, staleTime: 0, gcTime: 0, retry: false },
    ),
};
