import { Button } from "@/components/ui/button";
import { getYouTubeId } from "@/utils/get-youtube-id";
import { ArrowRightIcon } from "lucide-react";
import { useState } from "react";
import { VideoEditor } from "../../video-editor";

interface VideoStepProps {
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
  onNext: () => void;
}

export function VideoStep({
  videoUrl,
  onVideoUrlChange,
  onNext,
}: VideoStepProps) {
  const [videoError, setVideoError] = useState<string>();

  const handleNext = () => {
    if (!videoUrl.trim()) {
      setVideoError("Please enter a YouTube video link");
      return;
    }
    if (!getYouTubeId(videoUrl)) {
      setVideoError("Please enter a valid YouTube URL");
      return;
    }
    setVideoError(undefined);
    onNext();
  };

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <VideoEditor
        videoUrl={videoUrl}
        onVideoUrlChange={onVideoUrlChange}
        videoError={videoError}
        onErrorClear={() => setVideoError(undefined)}
      />

      <div className="flex justify-end">
        <Button onClick={handleNext} className="gap-2">
          Select Schools <ArrowRightIcon />
        </Button>
      </div>
    </div>
  );
}
