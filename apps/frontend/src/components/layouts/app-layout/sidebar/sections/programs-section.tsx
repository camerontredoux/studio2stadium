import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Separator } from "@/components/ui/separator";
import { RecommendedSchool } from "../recommended-school";

export function ProgramsSection() {
  return (
    <Frame className="border p-0 pt-1">
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2">
          Suggested Programs
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0! border-0 border-t">
        <RecommendedSchool />
        <Separator />
        <RecommendedSchool />
      </FramePanel>
    </Frame>
  );
}
