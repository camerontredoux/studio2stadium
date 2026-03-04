import type { ApiSchemas } from "@/lib/api/client";
import { client } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationQueries } from "./queries";

type Notification = ApiSchemas["NotificationsResponse"][number];

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      client.POST("/notifications/{id}", { params: { path: { id } } }),
    onMutate: async (id) => {
      await queryClient.cancelQueries(notificationQueries.notifications());
      await queryClient.cancelQueries(notificationQueries.count());

      const previousNotifications = queryClient.getQueryData<Notification[]>(
        notificationQueries.notifications().queryKey,
      );
      const previousCount = queryClient.getQueryData<{ count: number }>(
        notificationQueries.count().queryKey,
      );

      queryClient.setQueryData(
        notificationQueries.notifications().queryKey,
        (old: Notification[] | undefined) =>
          old?.map((n) => (n.id === id ? { ...n, read: true } : n)),
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

      const previousNotifications = queryClient.getQueryData<Notification[]>(
        notificationQueries.notifications().queryKey,
      );
      const previousCount = queryClient.getQueryData<{ count: number }>(
        notificationQueries.count().queryKey,
      );

      queryClient.setQueryData(
        notificationQueries.notifications().queryKey,
        (old: Notification[] | undefined) =>
          old?.map((n) => ({ ...n, read: true })),
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
