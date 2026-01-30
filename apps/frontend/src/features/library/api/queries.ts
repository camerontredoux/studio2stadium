import { $api } from "@/lib/api/client";

export const queries = {
  all: () => ["resources"],
  filters: () => $api.queryOptions("get", "/schools/filters"),
};
