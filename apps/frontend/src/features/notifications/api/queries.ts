import { $api, client } from "@/lib/api/client";

export const notificationQueries = {
  notifications: () => $api.queryOptions("get", "/notifications"),
  count: () =>
    $api.queryOptions(
      "get",
      "/notifications/count",
      {},
      { refetchInterval: 1000 * 30 },
    ),
};

export const notificationMutations = {
  markRead: (id: string) =>
    client.POST("/notifications/{id}", { params: { path: { id } } }),
  markAllRead: () => client.POST("/notifications/read-all"),
};
