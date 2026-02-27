import { $api } from "@/lib/api/client";

export const queries = {
  followingIds: (type: "dancer" | "school") =>
    $api.queryOptions(
      "get",
      type === "dancer"
        ? "/dancers/me/following/ids"
        : "/schools/me/following/ids",
    ),
  activity: ({ enabled }: { enabled?: boolean } = {}) =>
    $api.queryOptions("get", "/users/activity", {}, { enabled }),
};
