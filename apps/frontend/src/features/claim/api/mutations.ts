import { $api } from "@/lib/api/client";
import { queries } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Claims the Org(s) a purchase bought for the signed-in account. The session
 * carries the user's Org memberships, so it is refetched once the claim lands.
 */
export const useClaimOrg = () => {
  const queryClient = useQueryClient();

  return $api.useMutation("post", "/event-tiers/claim", {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.all() });
    },
  });
};
