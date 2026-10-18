import { $api, type ApiSchemas } from "@/lib/api/client";
import { type QueryKey, useQueryClient } from "@tanstack/react-query";
import { eventQueries } from "./queries";

type EventDetail = ApiSchemas["EventsIdResponse"];
type EventsList = ApiSchemas["EventsResponse"];
type GlobalEventsList = ApiSchemas["EventsGlobalResponse"];
type MutationContext = {
  previousDetail: EventDetail | undefined;
  previousLists: [QueryKey, EventsList | undefined][];
};
// Every filter variant of the events list, e.g. ["get", "/events", { params }].
const listsQueryKey = ["get", "/events"];

type GlobalMutationContext = {
  previousGlobalEvents: GlobalEventsList | undefined;
};

export function useSaveEvent(id: string) {
  const queryClient = useQueryClient();
  const detailQueryKey = eventQueries.event(id).queryKey;

  return $api.useMutation("post", "/events/{id}/save", {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: detailQueryKey });
      await queryClient.cancelQueries({ queryKey: listsQueryKey });

      const previousDetail =
        queryClient.getQueryData<EventDetail>(detailQueryKey);
      const previousLists = queryClient.getQueriesData<EventsList>({
        queryKey: listsQueryKey,
      });

      queryClient.setQueryData<EventDetail>(detailQueryKey, (old) =>
        old
          ? { ...old, saved: true, attendees: (old.attendees ?? 0) + 1 }
          : old,
      );

      queryClient.setQueriesData<EventsList>(
        { queryKey: listsQueryKey },
        (old) =>
          old?.map((month) => ({
            ...month,
            events: month.events.map((event) =>
              event.id === id ? { ...event, saved: true } : event,
            ),
          })),
      );

      return { previousDetail, previousLists };
    },
    onError: (_err, _variables, onMutateResult) => {
      const result = onMutateResult as MutationContext | undefined;
      if (result?.previousDetail) {
        queryClient.setQueryData<EventDetail>(
          detailQueryKey,
          result.previousDetail,
        );
      }
      for (const [queryKey, previousList] of result?.previousLists ?? []) {
        queryClient.setQueryData<EventsList>(queryKey, previousList);
      }
    },
    meta: {
      invalidateQueries: [detailQueryKey, listsQueryKey],
    },
  });
}

export function useUnsaveEvent(id: string) {
  const queryClient = useQueryClient();
  const detailQueryKey = eventQueries.event(id).queryKey;

  return $api.useMutation("delete", "/events/{id}/unsave", {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: detailQueryKey });
      await queryClient.cancelQueries({ queryKey: listsQueryKey });

      const previousDetail =
        queryClient.getQueryData<EventDetail>(detailQueryKey);
      const previousLists = queryClient.getQueriesData<EventsList>({
        queryKey: listsQueryKey,
      });

      queryClient.setQueryData<EventDetail>(detailQueryKey, (old) =>
        old
          ? {
              ...old,
              saved: false,
              attendees: Math.max((old.attendees ?? 1) - 1, 0),
            }
          : old,
      );

      queryClient.setQueriesData<EventsList>(
        { queryKey: listsQueryKey },
        (old) =>
          old?.map((month) => ({
            ...month,
            events: month.events.map((event) =>
              event.id === id ? { ...event, saved: false } : event,
            ),
          })),
      );

      return { previousDetail, previousLists };
    },
    onError: (_err, _variables, onMutateResult) => {
      const result = onMutateResult as MutationContext | undefined;
      if (result?.previousDetail) {
        queryClient.setQueryData<EventDetail>(
          detailQueryKey,
          result.previousDetail,
        );
      }
      for (const [queryKey, previousList] of result?.previousLists ?? []) {
        queryClient.setQueryData<EventsList>(queryKey, previousList);
      }
    },
    meta: {
      invalidateQueries: [detailQueryKey, listsQueryKey],
    },
  });
}

export function useSaveGlobalEvent(id: string) {
  const queryClient = useQueryClient();
  const globalEventsQueryKey = eventQueries.globalEvents().queryKey;

  const mutation = $api.useMutation("post", "/events/{id}/save", {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: globalEventsQueryKey });

      const previousGlobalEvents =
        queryClient.getQueryData<GlobalEventsList>(globalEventsQueryKey);

      queryClient.setQueryData<GlobalEventsList>(globalEventsQueryKey, (old) =>
        old?.map((event) =>
          event.id === id
            ? { ...event, saved: true, attendees: (event.attendees ?? 0) + 1 }
            : event,
        ),
      );

      return { previousGlobalEvents };
    },
    onError: (_err, _variables, onMutateResult) => {
      const result = onMutateResult as GlobalMutationContext | undefined;
      if (result?.previousGlobalEvents) {
        queryClient.setQueryData<GlobalEventsList>(
          globalEventsQueryKey,
          result.previousGlobalEvents,
        );
      }
    },
  });

  return {
    ...mutation,
    mutate: () =>
      mutation.mutate({
        params: { path: { id } },
        body: { type: "global" },
      }),
    mutateAsync: () =>
      mutation.mutateAsync({
        params: { path: { id } },
        body: { type: "global" },
      }),
  };
}

export function useUnsaveGlobalEvent(id: string) {
  const queryClient = useQueryClient();
  const globalEventsQueryKey = eventQueries.globalEvents().queryKey;

  const mutation = $api.useMutation("delete", "/events/{id}/unsave", {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: globalEventsQueryKey });

      const previousGlobalEvents =
        queryClient.getQueryData<GlobalEventsList>(globalEventsQueryKey);

      queryClient.setQueryData<GlobalEventsList>(globalEventsQueryKey, (old) =>
        old?.map((event) =>
          event.id === id
            ? { ...event, saved: false, attendees: (event.attendees ?? 1) - 1 }
            : event,
        ),
      );

      return { previousGlobalEvents };
    },
    onError: (_err, _variables, onMutateResult) => {
      const result = onMutateResult as GlobalMutationContext | undefined;
      if (result?.previousGlobalEvents) {
        queryClient.setQueryData<GlobalEventsList>(
          globalEventsQueryKey,
          result.previousGlobalEvents,
        );
      }
    },
  });

  return {
    ...mutation,
    mutate: () =>
      mutation.mutate({
        params: { path: { id } },
        body: { type: "global" },
      }),
    mutateAsync: () =>
      mutation.mutateAsync({
        params: { path: { id } },
        body: { type: "global" },
      }),
  };
}
