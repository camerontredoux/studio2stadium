import { usePremiumRoadmap } from "@/shared/premium-roadmap/hooks";
import { RoadmapCard } from "./roadmap-card";
import { isHidden } from "./steps";

/**
 * The Premium Recruiting Roadmap for eligible dancers. Renders nothing while
 * loading, on error, or for ineligible dancers so the feed always works, and
 * nothing once the roadmap is complete and past day 30.
 */
export function PremiumRoadmap() {
  const { roadmap } = usePremiumRoadmap();
  if (!roadmap || isHidden(roadmap)) return null;
  return <RoadmapCard roadmap={roadmap} />;
}
