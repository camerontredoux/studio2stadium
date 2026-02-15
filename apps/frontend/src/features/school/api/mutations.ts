import { $api } from "@/lib/api/client";
import { schoolQueries } from "./queries";

export function useFollowSchool(id: string) {
  return $api.useMutation("post", "/schools/{id}/follow", {
    meta: {
      invalidateQueries: [schoolQueries.metadata(id).queryKey],
    },
  });
}

export function useUnfollowSchool(id: string) {
  return $api.useMutation("delete", "/schools/{id}/follow", {
    meta: {
      invalidateQueries: [schoolQueries.metadata(id).queryKey],
    },
  });
}
