import { $api, type ApiSchemas } from "@/lib/api/client";

export type RosterClaim =
  ApiSchemas["OrgsIdAdminRosterclaimsResponse"]["data"][number];

const CLAIM_LIST_KEY_PREFIX = [
  "get",
  "/orgs/{slug}/admin/roster-claims",
] as const;

/**
 * Files a dancer's request that a roster entry belongs to her. Creates a
 * pending request for an org admin — it never links anything on its own.
 */
export function useCreateRosterClaim() {
  return $api.useMutation("post", "/orgs/{slug}/roster-claims");
}

export const rosterClaimQueries = {
  pending: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/admin/roster-claims", {
      params: { path: { slug } },
    }),
};

export function useResolveRosterClaim() {
  return $api.useMutation(
    "post",
    "/orgs/{slug}/admin/roster-claims/{claimId}/resolve",
    {
      meta: { invalidateQueries: [CLAIM_LIST_KEY_PREFIX] },
    }
  );
}
