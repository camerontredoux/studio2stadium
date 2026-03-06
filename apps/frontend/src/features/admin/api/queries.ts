import { $api } from "@/lib/api/client";

export const adminQueries = {
  applications: () => $api.queryOptions("get", "/admin/applications"),
  schools: () => $api.queryOptions("get", "/admin/schools"),
};
