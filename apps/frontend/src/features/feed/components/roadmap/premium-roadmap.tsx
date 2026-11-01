import { usePremiumRoadmap } from "@/shared/premium-roadmap/hooks";
import { RoadmapCard } from "./roadmap-card";

/**
 * The Premium Recruiting Roadmap for eligible dancers. Renders nothing while
 * loading, on error, or for ineligible dancers so the feed always works.
 */
export function PremiumRoadmap() {
  const { roadmap } = usePremiumRoadmap();
  if (!roadmap) return null;
  return <RoadmapCard roadmap={roadmap} />;
}
