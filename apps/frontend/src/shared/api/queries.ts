import { $api } from "@/lib/api/client";

export const queries = {
  following: () => $api.queryOptions("get", "/dancers/me/following"),
};
