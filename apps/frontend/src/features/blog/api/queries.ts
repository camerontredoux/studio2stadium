import { $api } from "@/lib/api/client";

export const blogQueries = {
  all: () => $api.queryOptions("get", "/blog"),
};
