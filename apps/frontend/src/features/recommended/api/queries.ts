import { $api } from "@/lib/api/client";

export const recommendedQueries = {
  recommended: () => $api.queryOptions("get", "/schools/recommended"),
};
