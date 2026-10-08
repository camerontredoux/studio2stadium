import { useSession } from "@/lib/session";
import { useQuery } from "@tanstack/react-query";
import { premiumRoadmapQueries } from "./api/queries";
import type { PremiumRoadmap } from "./types";

/** The dancer's roadmap, or undefined while loading, on error, or if ineligible. */
export function usePremiumRoadmap() {
  const session = useSession();
  const query = useQuery(
    premiumRoadmapQueries.get({ enabled: session.type === "dancer" }),
  );
  return { ...query, roadmap: query.data?.roadmap ?? undefined };
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
