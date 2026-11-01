import { toastManager } from "@/components/ui/toast-manager";
import { $api, type ApiSchemas } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/errors";
import { useQueryClient } from "@tanstack/react-query";
import { trackerQueries } from "./queries";

export type Tracker = ApiSchemas["TrackerResponse"];
export type TrackerItem = Tracker["items"][number];
export type TrackerMilestone = Tracker["milestones"][number];

function showError(error: ApiError | undefined) {
  toastManager.add({
    type: "error",
    title: "Couldn't save your change",
    description:
      error?.errors?.[0]?.message ??
      error?.message ??
      "Something went wrong. Please try again.",
  });
}

// Applies a change to the cached tracker right away, rolls it back if the
// request fails, and refetches once the request settles.
function useOptimisticTracker() {
  const queryClient = useQueryClient();
  const { queryKey } = trackerQueries.tracker();

  return {
    update: async (change: (tracker: Tracker) => Tracker) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Tracker>(queryKey);
      if (previous) queryClient.setQueryData(queryKey, change(previous));
      return { previous };
    },
    rollback: (error: ApiError, _variables: unknown, context: unknown) => {
      const { previous } = (context ?? {}) as { previous?: Tracker };
      if (previous) queryClient.setQueryData(queryKey, previous);
      showError(error);
    },
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
}

export function useCreateTrackerItem() {
  const queryClient = useQueryClient();
  const { queryKey } = trackerQueries.tracker();

  return $api.useMutation("post", "/tracker/items", {
    onSuccess: (item) => {
      queryClient.setQueryData<Tracker>(queryKey, (old) =>
        old ? { ...old, items: [item, ...old.items] } : old,
      );
      queryClient.invalidateQueries({ queryKey });
      // The Premium Recruiting Roadmap has a step for adding a tracker item.
      queryClient.invalidateQueries({ queryKey: ["get", "/premium-roadmap"] });
    },
    onError: showError,
  });
}

export function useUpdateTrackerItem() {
  const tracker = useOptimisticTracker();
  return $api.useMutation("patch", "/tracker/items/{id}", {
    onMutate: ({ params, body }) =>
      tracker.update((old) => ({
        ...old,
        items: old.items.map((item) =>
          item.id === params.path.id
            ? {
                ...item,
                title: body?.title ?? item.title,
                stage: body?.stage != null ? Number(body.stage) : item.stage,
                // undefined leaves a field as is; null clears it.
                date:
                  body?.date === undefined
                    ? item.date
                    : String(body.date ?? "") || null,
                notes: body?.notes === undefined ? item.notes : body.notes,
              }
            : item,
        ),
      })),
    onError: tracker.rollback,
    onSettled: tracker.refetch,
  });
}

export function useDeleteTrackerItem() {
  const tracker = useOptimisticTracker();
  return $api.useMutation("delete", "/tracker/items/{id}", {
    onMutate: ({ params }) =>
      tracker.update((old) => ({
        ...old,
        items: old.items.filter((item) => item.id !== params.path.id),
      })),
    onError: tracker.rollback,
    onSettled: tracker.refetch,
  });
}

export function useDeleteTrackerSection() {
  const tracker = useOptimisticTracker();
  return $api.useMutation("delete", "/tracker/sections", {
    onMutate: (variables) =>
      tracker.update((old) => ({
        ...old,
        items: old.items.filter(
          (item) => item.school?.id !== variables?.body?.schoolId,
        ),
        milestones: old.milestones.filter(
          (milestone) => milestone.schoolId !== variables?.body?.schoolId,
        ),
      })),
    onError: tracker.rollback,
    onSettled: tracker.refetch,
  });
}

export function useReorderTrackerSections() {
  const tracker = useOptimisticTracker();
  return $api.useMutation("put", "/tracker/sections/order", {
    onMutate: (variables) =>
      tracker.update((old) => ({
        ...old,
        sectionOrder: variables?.body?.sections ?? old.sectionOrder,
      })),
    onError: tracker.rollback,
    onSettled: tracker.refetch,
  });
}

export function useCreateTrackerMilestone() {
  const queryClient = useQueryClient();
  const { queryKey } = trackerQueries.tracker();

  return $api.useMutation("post", "/tracker/milestones", {
    onSuccess: (milestone) => {
      // Milestones are listed oldest first, so a new one goes last.
      queryClient.setQueryData<Tracker>(queryKey, (old) =>
        old ? { ...old, milestones: [...old.milestones, milestone] } : old,
      );
      queryClient.invalidateQueries({ queryKey });
    },
    onError: showError,
  });
}

export function useUpdateTrackerMilestone() {
  const tracker = useOptimisticTracker();
  return $api.useMutation("patch", "/tracker/milestones/{id}", {
    onMutate: ({ params, body }) =>
      tracker.update((old) => ({
        ...old,
        milestones: old.milestones.map((milestone) =>
          milestone.id === params.path.id
            ? {
                ...milestone,
                title: body?.title ?? milestone.title,
                // undefined leaves it as is; the refetch brings the real time.
                completedAt:
                  body?.completed == null
                    ? milestone.completedAt
                    : body.completed
                      ? (milestone.completedAt ?? new Date().toISOString())
                      : null,
              }
            : milestone,
        ),
      })),
    onError: tracker.rollback,
    onSettled: tracker.refetch,
  });
}

export function useDeleteTrackerMilestone() {
  const tracker = useOptimisticTracker();
  return $api.useMutation("delete", "/tracker/milestones/{id}", {
    onMutate: ({ params }) =>
      tracker.update((old) => ({
        ...old,
        milestones: old.milestones.filter(
          (milestone) => milestone.id !== params.path.id,
        ),
      })),
    onError: tracker.rollback,
    onSettled: tracker.refetch,
  });
}
