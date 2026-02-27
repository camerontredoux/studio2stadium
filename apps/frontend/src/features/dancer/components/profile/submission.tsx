import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Link } from "@tanstack/react-router";
import type { DancerProfile } from "../../types";
import { useProfile } from "./context/use-profile";

interface SubmissionProps {
  data: DancerProfile["submission"];
}

export function Submission({ data }: SubmissionProps) {
  const { showOwnerControls } = useProfile();

  if (!showOwnerControls && !data?.youtubeId) return null;

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Common Recruiting
          {showOwnerControls ? (
            <Button
              size="xs"
              render={
                <Link
                  to={
                    data?.youtubeId ? "/recruiting/edit" : "/recruiting/submit"
                  }
                />
              }
            >
              {data?.youtubeId ? "Edit" : "Submit"}
            </Button>
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
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
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
