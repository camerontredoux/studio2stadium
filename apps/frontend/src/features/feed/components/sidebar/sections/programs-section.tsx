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
import { RecommendedSchool } from "./recommended-school";

export function ProgramsSection() {
  const { data: recommended } = useSuspenseQuery(feedQueries.recommended());
  const spotlightIndex = useSpotlightIndex(recommended.length);

  // Exclude the program currently featured in the spotlight so it doesn't
  // appear twice on screen.
  const suggested = recommended.filter((_, index) => index !== spotlightIndex);

  return (
    <Frame compact>
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2">
          Suggested Programs
          <Button size="xs" className="ml-auto" render={<Link to="/explore" />}>
            Explore
          </Button>
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="divide-y">
        {suggested.length > 0 ? (
          suggested.map((school) => (
            <RecommendedSchool key={school.id} school={school} />
          ))
        ) : (
          <div className="flex items-center justify-center px-5 py-4">
            <p className="text-muted-foreground text-sm">
              {recommended.length > 0
                ? "No additional recommended programs found."
                : "No recommended programs found."}
            </p>
          </div>
        )}
      </FramePanel>
    </Frame>
  );
}
