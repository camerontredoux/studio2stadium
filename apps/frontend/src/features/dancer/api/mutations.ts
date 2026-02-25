import { $api } from "@/lib/api/client";
import { feedQueries } from "@/shared/feed/api/queries";
import { dancerQueries } from "./queries";

const checklistKey = feedQueries.dancerChecklist().queryKey;

export function useUpdateSkills() {
  return $api.useMutation("patch", "/dancers/me/skills", {
    meta: {
      invalidateQueries: [dancerQueries.skills().queryKey, checklistKey],
    },
  });
}

export function useUpdateStyles() {
  return $api.useMutation("patch", "/dancers/me/styles", {
    meta: {
      invalidateQueries: [dancerQueries.styles().queryKey, checklistKey],
    },
  });
}

export function useUpdateSports() {
  return $api.useMutation("patch", "/dancers/me/sports", {
    meta: {
      invalidateQueries: [dancerQueries.sports().queryKey, checklistKey],
    },
  });
}

export function useUpdateProfile(username: string) {
  return $api.useMutation("patch", "/dancers/me/portfolio", {
    meta: {
      invalidateQueries: [
        dancerQueries.profile(username).queryKey,
        checklistKey,
      ],
    },
  });
}
