import { $api } from "@/lib/api/client";
import { dancerQueries } from "./queries";

export function useUpdateSkills() {
  return $api.useMutation("patch", "/dancers/me/skills", {
    meta: {
      invalidateQueries: [dancerQueries.skills().queryKey],
    },
  });
}
