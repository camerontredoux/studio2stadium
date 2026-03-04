import { $api } from "@/lib/api/client";

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
