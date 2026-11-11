import { toastManager } from "@/components/ui/toast-manager";
import { $api } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/errors";
import { feedQueries } from "@/shared/feed/api/queries";
import { useQueryClient } from "@tanstack/react-query";
import type { DancerProfile } from "../types";
import { dancerQueries } from "./queries";

const checklistKey = feedQueries.dancerChecklist().queryKey;

export function useUpdateSkills(profileUsername?: string) {
  return $api.useMutation("patch", "/dancers/me/skills", {
    meta: {
      invalidateQueries: [
        dancerQueries.skills().queryKey,
        checklistKey,
        ...(profileUsername
          ? [dancerQueries.profile(profileUsername).queryKey]
          : []),
      ],
    },
  });
}

export function useUpdateStyles(username: string) {
  return $api.useMutation("patch", "/dancers/me/styles", {
    meta: {
      invalidateQueries: [
        dancerQueries.profile(username).queryKey,
        dancerQueries.styles().queryKey,
        checklistKey,
      ],
    },
  });
}

export function useUpdateSports(profileUsername?: string) {
  return $api.useMutation("patch", "/dancers/me/sports", {
    meta: {
      invalidateQueries: [
        dancerQueries.sports().queryKey,
        checklistKey,
        ...(profileUsername
          ? [dancerQueries.profile(profileUsername).queryKey]
          : []),
      ],
    },
  });
}

export function useUpdateProfile(username: string) {
  return $api.useMutation("patch", "/dancers/me", {
    meta: {
      invalidateQueries: [
        dancerQueries.profile(username).queryKey,
        checklistKey,
      ],
    },
  });
}

export function useCreateAchievement(username: string) {
  return $api.useMutation("post", "/dancers/achievements/achievements", {
    meta: {
      invalidateQueries: [dancerQueries.profile(username).queryKey],
    },
  });
}

export function useDeleteAchievement(username: string) {
  return $api.useMutation("delete", "/dancers/achievements/achievements/{id}", {
    meta: {
      invalidateQueries: [dancerQueries.profile(username).queryKey],
    },
  });
}

export function useUpdateAchievement(username: string) {
  return $api.useMutation("patch", "/dancers/achievements/achievements/{id}", {
    meta: {
      invalidateQueries: [dancerQueries.profile(username).queryKey],
    },
  });
}

export function useCreateReference(username: string) {
  return $api.useMutation("post", "/dancers/references", {
    meta: {
      invalidateQueries: [dancerQueries.profile(username).queryKey],
    },
  });
}

export function useDeleteReference(username: string) {
  return $api.useMutation("delete", "/dancers/references/{id}", {
    meta: {
      invalidateQueries: [dancerQueries.profile(username).queryKey],
    },
  });
}

export function useUpdateReference(username: string) {
  return $api.useMutation("patch", "/dancers/references/{id}", {
    meta: {
      invalidateQueries: [dancerQueries.profile(username).queryKey],
    },
  });
}

export function useViewDancer() {
  return $api.useMutation("post", "/schools/me/view-dancer/{id}");
}

// Shows a new order on the profile at once, puts the old one back if the save
// fails, and refetches either way.
function useOptimisticProfile(username: string) {
  const queryClient = useQueryClient();
  const { queryKey } = dancerQueries.profile(username);

  return {
    update: async (change: (profile: DancerProfile) => DancerProfile) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DancerProfile>(queryKey);
      if (previous) queryClient.setQueryData(queryKey, change(previous));
      return { previous };
    },
    rollback: (error: ApiError, _variables: unknown, context: unknown) => {
      const { previous } = (context ?? {}) as { previous?: DancerProfile };
      if (previous) queryClient.setQueryData(queryKey, previous);
      toastManager.add({
        type: "error",
        title: "Couldn't save the new order",
        description:
          error?.message ?? "Something went wrong. Please try again.",
      });
    },
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
}

function byIds<T extends { id: string }>(rows: T[], ids: string[]) {
  const index = new Map(ids.map((id, i) => [id, i]));
  return [...rows].sort(
    (a, b) => (index.get(a.id) ?? Infinity) - (index.get(b.id) ?? Infinity),
  );
}

export function useReorderAchievements(username: string) {
  const profile = useOptimisticProfile(username);
  return $api.useMutation("put", "/dancers/achievements/order", {
    onMutate: (variables) =>
      profile.update((old) => ({
        ...old,
        achievements: byIds(old.achievements, variables?.body?.ids ?? []),
      })),
    onError: profile.rollback,
    onSettled: profile.refetch,
  });
}

export function useReorderReferences(username: string) {
  const profile = useOptimisticProfile(username);
  return $api.useMutation("put", "/dancers/references/order", {
    onMutate: (variables) =>
      profile.update((old) => ({
        ...old,
        references: byIds(old.references, variables?.body?.ids ?? []),
      })),
    onError: profile.rollback,
    onSettled: profile.refetch,
  });
}

export function useReorderMedia(username: string) {
  const profile = useOptimisticProfile(username);
  return $api.useMutation("put", "/media/order", {
    onMutate: (variables) => {
      const position = new Map(
        (variables?.body?.items ?? []).map((item, i) => [
          `${item.type}:${item.id}`,
          i,
        ]),
      );
      return profile.update((old) => ({
        ...old,
        images: old.images.map((image) => ({
          ...image,
          position: position.get(`image:${image.id}`) ?? image.position,
        })),
        videos: old.videos.map((video) => ({
          ...video,
          position: position.get(`video:${video.id}`) ?? video.position,
        })),
      }));
    },
    onError: profile.rollback,
    onSettled: profile.refetch,
  });
}
