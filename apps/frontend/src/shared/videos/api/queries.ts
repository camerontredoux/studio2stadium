import { $api } from "@/lib/api/client";

export const videoQueries = {
  permissions: () => $api.queryOptions("get", "/videos/permissions"),
};
