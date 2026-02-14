import { $api, type ApiSchemas } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { eventQueries } from "./queries";

type EventDetail = ApiSchemas["EventsIdResponse"];
type EventsList = ApiSchemas["EventsResponse"];
type MutationContext = {
  previousDetail: EventDetail | undefined;
  previousList: EventsList | undefined;
};

export function useSaveEvent(id: string) {
  const queryClient = useQueryClient();
  const detailQueryKey = eventQueries.event(id).queryKey;
  const listQueryKey = eventQueries.events().queryKey;

  return $api.useMutation("post", "/events/{id}/save", {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: detailQueryKey });
      await queryClient.cancelQueries({ queryKey: listQueryKey });

      const previousDetail =
        queryClient.getQueryData<EventDetail>(detailQueryKey);
      const previousList = queryClient.getQueryData<EventsList>(listQueryKey);

      queryClient.setQueryData<EventDetail>(detailQueryKey, (old) =>
        old
          ? { ...old, saved: true, attendees: (old.attendees ?? 0) + 1 }
          : old,
      );

      queryClient.setQueryData<EventsList>(listQueryKey, (old) =>
        old?.map((month) => ({
          ...month,
          events: month.events.map((event) =>
            event.id === id ? { ...event, saved: true } : event,
          ),
        })),
      );

      return { previousDetail, previousList };
    },
    onError: (_err, _variables, onMutateResult) => {
      const result = onMutateResult as MutationContext | undefined;
      if (result?.previousDetail) {
        queryClient.setQueryData<EventDetail>(
          detailQueryKey,
          result.previousDetail,
        );
      }
      if (result?.previousList) {
        queryClient.setQueryData<EventsList>(listQueryKey, result.previousList);
      }
    },
    meta: {
      invalidateQueries: [detailQueryKey],
    },
  });
}

export function useUnsaveEvent(id: string) {
  const queryClient = useQueryClient();
  const detailQueryKey = eventQueries.event(id).queryKey;
  const listQueryKey = eventQueries.events().queryKey;

  return $api.useMutation("delete", "/events/{id}/unsave", {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: detailQueryKey });
      await queryClient.cancelQueries({ queryKey: listQueryKey });

      const previousDetail =
        queryClient.getQueryData<EventDetail>(detailQueryKey);
      const previousList = queryClient.getQueryData<EventsList>(listQueryKey);

      queryClient.setQueryData<EventDetail>(detailQueryKey, (old) =>
        old
          ? {
              ...old,
              saved: false,
              attendees: Math.max((old.attendees ?? 1) - 1, 0),
            }
          : old,
      );

      queryClient.setQueryData<EventsList>(listQueryKey, (old) =>
        old?.map((month) => ({
          ...month,
          events: month.events.map((event) =>
            event.id === id ? { ...event, saved: false } : event,
          ),
        })),
      );

      return { previousDetail, previousList };
    },
    onError: (_err, _variables, onMutateResult) => {
      const result = onMutateResult as MutationContext | undefined;
      if (result?.previousDetail) {
        queryClient.setQueryData<EventDetail>(
          detailQueryKey,
          result.previousDetail,
        );
      }
      if (result?.previousList) {
        queryClient.setQueryData<EventsList>(listQueryKey, result.previousList);
      }
    },
    meta: {
      invalidateQueries: [detailQueryKey],
    },
  });
}
