import { track } from "@/lib/analytics";
import { client } from "@/lib/api/client";
import { queryOptions } from "@tanstack/react-query";
import type { PremiumRoadmap } from "../types";

const DAY_MS = 86_400_000;

// The server reports which completions this request recorded for the first
// time, so each completion event is sent from the one response that has it.
function trackCompletions(roadmap: PremiumRoadmap) {
  for (const key of roadmap.newlyCompleted) {
    const step = roadmap.steps.find((s) => s.key === key);
    track("premium_roadmap_step_completed", {
      step_key: key,
      completed_at: step?.completedAt,
      roadmap_version: roadmap.version,
      subscription_interval: roadmap.interval,
      premium_started_at: roadmap.premiumStartedAt,
    });
  }
  if (roadmap.roadmapNewlyCompleted && roadmap.completedAt) {
    track("premium_roadmap_completed", {
      days_to_complete: Math.floor(
        (Date.parse(roadmap.completedAt) -
          Date.parse(roadmap.premiumStartedAt)) /
          DAY_MS,
      ),
      completed_at: roadmap.completedAt,
      roadmap_version: roadmap.version,
      subscription_interval: roadmap.interval,
      premium_started_at: roadmap.premiumStartedAt,
    });
  }
}

export const premiumRoadmapQueries = {
  get: ({ enabled }: { enabled?: boolean } = {}) =>
    queryOptions({
      queryKey: ["get", "/premium-roadmap"],
      queryFn: async () => {
        const { data, error } = await client.GET("/premium-roadmap");
        if (error) throw error;
        if (data.roadmap) trackCompletions(data.roadmap);
        return data;
      },
      // Each request can record newly completed steps, so refetch whenever
      // the card or a follow button mounts.
      staleTime: 0,
      enabled,
    }),
};
