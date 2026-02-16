import { $api } from "@/lib/api/client";

export const queries = {
  followingIds: () => $api.queryOptions("get", "/dancers/me/following-ids"),
  activity: () => $api.queryOptions("get", "/users/activity"),
};
