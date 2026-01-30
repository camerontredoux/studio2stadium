import { $api } from "@/lib/api/client";

export const queries = {
  all: () => ["events"],
  filters: () => $api.queryOptions("get", "/schools/filters"),
};
