import { $api } from "@/lib/api/client";
import { schoolQueries } from "./queries";

export function useShowInterest(id: string) {
  return $api.useMutation("post", "/schools/{id}/interest", {
    meta: {
      invalidateQueries: [schoolQueries.metadata(id).queryKey],
    },
  });
}
