import { $api } from "@/lib/api/client";
import { schoolQueries } from "./queries";

export function useShowInterest(id: string) {
  return $api.useMutation("post", "/schools/{id}/interest", {
    meta: {
      invalidateQueries: [schoolQueries.metadata(id).queryKey],
    },
  });
}

export function useCreateEvent(username: string) {
  return $api.useMutation("post", "/events", {
    meta: {
      invalidateQueries: [schoolQueries.profile(username).queryKey],
    },
  });
}

export function useUpdateEvent(username: string) {
  return $api.useMutation("patch", "/events/{id}", {
    meta: {
      invalidateQueries: [schoolQueries.profile(username).queryKey],
    },
  });
}
