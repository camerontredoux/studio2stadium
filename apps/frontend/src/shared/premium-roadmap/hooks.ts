import { useSession } from "@/lib/session";
import { useQuery } from "@tanstack/react-query";
import { premiumRoadmapQueries } from "./api/queries";
import { useRecruitingTrackerEnabled } from "./flag";
import type { PremiumRoadmap } from "./types";

/**
 * The dancer's roadmap, or undefined while loading, on error, if ineligible,
 * or with the feature flag off.
 */
export function usePremiumRoadmap() {
  const session = useSession();
  const flag = useRecruitingTrackerEnabled();
  const query = useQuery(
    premiumRoadmapQueries.get({ enabled: session.type === "dancer" && !!flag }),
  );
  return {
    ...query,
    // Count waiting on the flag as loading, so the checklist doesn't flash.
    isLoading: flag === undefined || query.isLoading,
    roadmap: (flag && query.data?.roadmap) || undefined,
  };
}

export type Readiness = "ready" | "not_ready" | "unknown";

/**
 * Whether the dancer's profile and video steps are complete. "unknown" for
 * dancers without a roadmap (free, past day 30, or roadmap off).
 */
export function readinessOf(roadmap: PremiumRoadmap | undefined): Readiness {
  if (!roadmap) return "unknown";
  return roadmap.steps
    .filter((s) => s.key === "profile" || s.key === "video")
    .every((s) => s.status === "complete")
    ? "ready"
    : "not_ready";
}
