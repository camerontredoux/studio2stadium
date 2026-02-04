import { $api } from "@/lib/api/client";

export const queries = {
  all: () => ["explore"],
  filters: () => $api.queryOptions("get", "/schools/filters"),
};
