import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { feedQueries } from "@/features/feed/api/queries";
import { useSpotlightIndex } from "@/features/feed/hooks/use-spotlight-index";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { RecommendedDancer } from "./recommended-dancer";

export function DancersSection() {
  const { data: recommended } = useSuspenseQuery(
    feedQueries.recommendedDancers(),
  );
  const spotlightIndex = useSpotlightIndex(recommended.length);

  // Exclude the dancer currently featured in the spotlight so they don't
  // appear twice on screen. The rest of the top-20 pool fills this list.
  const suggested = recommended.filter((_, index) => index !== spotlightIndex);

  return (
    <Frame compact>
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2">
          Suggested Dancers
          <Button size="xs" className="ml-auto" render={<Link to="/dancers" />}>
            Explore
          </Button>
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="divide-y">
        {suggested.length > 0 ? (
          suggested.map((dancer) => (
            <RecommendedDancer key={dancer.id} dancer={dancer} />
          ))
        ) : (
          <div className="flex items-center justify-center px-5 py-4">
            <p className="text-muted-foreground text-sm">
              {recommended.length > 0
                ? "No additional recommended dancers found."
                : "No recommended dancers found."}
            </p>
          </div>
        )}
      </FramePanel>
    </Frame>
  );
}
