import { $api, type ApiSchemas } from "@/lib/api/client";
import {
  type InfiniteData,
  type QueryClient,
  useQueryClient,
} from "@tanstack/react-query";
import { notificationQueries } from "./queries";

type NotificationsResponse = ApiSchemas["NotificationsResponse"];
type InfiniteNotifications = InfiniteData<
  NotificationsResponse,
  string | undefined
>;

// The optimistic writes aren't rolled back from a snapshot: a snapshot taken
// by one mutation would undo another's change. Refetching once the request
// settles puts the server's state back either way.
function refetchNotifications(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: notificationQueries.notifications().queryKey,
    }),
    queryClient.invalidateQueries({
      queryKey: notificationQueries.count().queryKey,
    }),
  ]);
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return $api.useMutation("post", "/notifications/{id}", {
    onMutate: async ({ params }) => {
      const id = params.path.id;
      await queryClient.cancelQueries(notificationQueries.notifications());
      await queryClient.cancelQueries(notificationQueries.count());

      queryClient.setQueryData<InfiniteNotifications>(
        notificationQueries.notifications().queryKey,
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  data: page.data.map((n) =>
                    n.id === id ? { ...n, read: true } : n,
                  ),
                })),
              }
            : undefined,
      );

      queryClient.setQueryData(
        notificationQueries.count().queryKey,
        (old: { count: number } | undefined) =>
          old ? { count: Math.max(0, old.count - 1) } : undefined,
      );
    },
    onSettled: () => refetchNotifications(queryClient),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return $api.useMutation("post", "/notifications/read-all", {
    onMutate: async () => {
      await queryClient.cancelQueries(notificationQueries.notifications());
      await queryClient.cancelQueries(notificationQueries.count());

      queryClient.setQueryData<InfiniteNotifications>(
        notificationQueries.notifications().queryKey,
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  data: page.data.map((n) => ({ ...n, read: true })),
                })),
              }
            : undefined,
      );

      queryClient.setQueryData(
        notificationQueries.count().queryKey,
        (old: { count: number } | undefined) =>
          old ? { count: 0 } : undefined,
      );
    },
    onSettled: () => refetchNotifications(queryClient),
  });
}
