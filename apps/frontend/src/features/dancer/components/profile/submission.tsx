import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { recruitingQueries } from "@/features/recruiting/api/queries";
import { useQuery } from "@tanstack/react-query";
import { useProfile } from "./context/use-profile";

export function Submission() {
  const { showOwnerControls } = useProfile();

  const { data } = useQuery(recruitingQueries.submission());

  if (!showOwnerControls && !data?.youtubeId) return null;

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Common Recruiting
          {showOwnerControls ? (
            data?.youtubeId ? (
              <Button size="xs">Edit</Button>
            ) : (
              <Button size="xs">Submit</Button>
            )
          ) : (
            <Button
              disabled
              size="xs"
              variant="outline"
              className="text-brand border-brand"
            >
              Featured
            </Button>
          )}
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="aspect-video p-0!">
        {data?.youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${data?.youtubeId}`}
            title="Common Recruiting"
            className="h-full w-full"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center">
            No video submitted
          </div>
        )}
      </FramePanel>
    </Frame>
  );
}
