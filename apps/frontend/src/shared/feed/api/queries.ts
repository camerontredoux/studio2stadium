import { $api } from "@/lib/api/client";

export const feedQueries = {
  dancerChecklist: () => $api.queryOptions("get", "/dancers/me/checklist"),
};
