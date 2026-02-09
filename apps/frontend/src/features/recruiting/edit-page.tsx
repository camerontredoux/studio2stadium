import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, CheckIcon, SaveIcon } from "lucide-react";
import { useState } from "react";
import { MOCK_VIDEO_URL } from "./components/mock-data";
import { extractYouTubeId } from "./components/utils/extract-youtube-id";
import { VideoEditor } from "./components/video-editor";

export function EditPage() {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState(MOCK_VIDEO_URL);
  const [videoError, setVideoError] = useState<string>();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!videoUrl.trim()) {
      setVideoError("Please enter a YouTube video link");
      return;
    }
    if (!extractYouTubeId(videoUrl)) {
      setVideoError("Please enter a valid YouTube URL");
      return;
    }
    setVideoError(undefined);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mobile:pb-14 flex flex-col gap-4 lg:gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-0.5 max-sm:pl-1">
          <h1 className="text-2xl leading-none font-bold tracking-tight">
            Edit Video
          </h1>
          <p className="text-muted-foreground text-sm">
            Update your recruiting video link
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/recruiting" })}
        >
          <ArrowLeftIcon /> Back to Submissions
        </Button>
      </div>

      <VideoEditor
        videoUrl={videoUrl}
        onVideoUrlChange={(url) => {
          setVideoUrl(url);
          setSaved(false);
        }}
        videoError={videoError}
        onErrorClear={() => setVideoError(undefined)}
        headerAction={
          <Button onClick={handleSave} size="sm" className="gap-2">
            {saved ? (
              <>
                <CheckIcon /> Saved
              </>
            ) : (
              <>
                <SaveIcon /> Save Changes
              </>
            )}
          </Button>
        }
      />
    </div>
  );
}
