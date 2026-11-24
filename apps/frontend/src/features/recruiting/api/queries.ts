import { $api } from "@/lib/api/client";

export const recruitingQueries = {
  submissions: () => $api.queryOptions("get", "/dancers/submissions"),
  schools: () => $api.queryOptions("get", "/dancers/submissions/schools"),
  submission: () => $api.queryOptions("get", "/dancers/submissions/video"),
  schoolSubmissions: () => $api.queryOptions("get", "/schools/me/submissions"),
  mySpotlights: () => $api.queryOptions("get", "/dancers/me/spotlights"),
  following: () => $api.queryOptions("get", "/dancers/me/following"),
  // Every program registered on S2S — the selectable targets for a spotlight.
  programs: () => $api.queryOptions("get", "/schools"),
};
