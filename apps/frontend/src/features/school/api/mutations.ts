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

export function useUpdateSkills(profileUsername?: string) {
  return $api.useMutation("patch", "/schools/me/skills", {
    meta: {
      invalidateQueries: [
        schoolQueries.skills().queryKey,
        ...(profileUsername
          ? [schoolQueries.profile(profileUsername).queryKey]
          : []),
      ],
    },
  });
}

export function useUpdateProgram(username: string) {
  return $api.useMutation("patch", "/schools/me", {
    meta: {
      invalidateQueries: [schoolQueries.profile(username).queryKey],
    },
  });
}
