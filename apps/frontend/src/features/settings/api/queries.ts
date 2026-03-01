import { $api } from "@/lib/api/client";

export const accountQueries = {
  account: () => $api.queryOptions("get", "/users/account"),
  application: () => $api.queryOptions("get", "/application"),
};
