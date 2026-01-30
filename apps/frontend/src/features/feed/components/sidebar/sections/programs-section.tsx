import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import { RecommendedSchool } from "./recommended-school";

export function ProgramsSection() {
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
      <FramePanel>
        <RecommendedSchool />
        <Separator />
        <RecommendedSchool />
      </FramePanel>
    </Frame>
  );
}
