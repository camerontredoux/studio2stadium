import { $api } from "@/lib/api/client";
import { sessionQueries } from "@/lib/session/queries";
import { dancerQueries } from "./queries";

export function useUpdateDancerProfile() {
  return $api.useMutation("patch", "/dancers/me/profile", {
    meta: {
      invalidateQueries: [
        dancerQueries.settings.profile().queryKey,
        sessionQueries.all(),
      ],
    },
  });
}
