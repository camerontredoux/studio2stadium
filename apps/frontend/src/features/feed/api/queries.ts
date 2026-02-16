import { $api } from "@/lib/api/client";

export const feedQueries = {
  feed: () => $api.queryOptions("get", "/feed"),
};
