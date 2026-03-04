import type { ApiSchemas } from "@/lib/api/client";
import { client } from "@/lib/api/client";
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { notificationQueries } from "./queries";

type NotificationsResponse = ApiSchemas["NotificationsResponse"];
type InfiniteNotifications = InfiniteData<
  NotificationsResponse,
  string | undefined
>;

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      client.POST("/notifications/{id}", { params: { path: { id } } }),
    onMutate: async (id) => {
      await queryClient.cancelQueries(notificationQueries.notifications());
      await queryClient.cancelQueries(notificationQueries.count());

      const previousNotifications =
        queryClient.getQueryData<InfiniteNotifications>(
          notificationQueries.notifications().queryKey,
        );
      const previousCount = queryClient.getQueryData<{ count: number }>(
        notificationQueries.count().queryKey,
      );

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
          old ? { count: Math.max(0, old.count - 1) } : { count: 0 },
      );

      return { previousNotifications, previousCount };
    },
    onError: (_err, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationQueries.notifications().queryKey,
          context.previousNotifications,
        );
      }
      if (context?.previousCount) {
        queryClient.setQueryData(
          notificationQueries.count().queryKey,
          context.previousCount,
        );
      }
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => client.POST("/notifications/read-all"),
    onMutate: async () => {
      await queryClient.cancelQueries(notificationQueries.notifications());
      await queryClient.cancelQueries(notificationQueries.count());

      const previousNotifications =
        queryClient.getQueryData<InfiniteNotifications>(
          notificationQueries.notifications().queryKey,
        );
      const previousCount = queryClient.getQueryData<{ count: number }>(
        notificationQueries.count().queryKey,
      );

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

      queryClient.setQueryData(notificationQueries.count().queryKey, {
        count: 0,
      });

      return { previousNotifications, previousCount };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationQueries.notifications().queryKey,
          context.previousNotifications,
        );
      }
      if (context?.previousCount) {
        queryClient.setQueryData(
          notificationQueries.count().queryKey,
          context.previousCount,
        );
      }
    },
  });
}
