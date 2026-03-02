import { $api } from "@/lib/api/client";

export const recruitingQueries = {
  submissions: () => $api.queryOptions("get", "/dancers/submissions"),
  schools: () => $api.queryOptions("get", "/dancers/submissions/schools"),
  submission: () => $api.queryOptions("get", "/dancers/submissions/video"),
  schoolSubmissions: () => $api.queryOptions("get", "/schools/me/submissions"),
};
