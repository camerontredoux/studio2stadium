import { Button } from "@/components/ui/button";
import { useEditSubmission } from "@/features/recruiting/api/mutations";
import { recruitingQueries } from "@/features/recruiting/api/queries";
import { getYouTubeId } from "@/utils/get-youtube-id";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, CheckIcon, LoaderIcon, SaveIcon } from "lucide-react";
import { useState } from "react";
import { VideoEditor } from "../video-editor";

export function EditPage() {
  const navigate = useNavigate();
  const { data } = useQuery(recruitingQueries.submission());

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

      {data?.youtubeId && <EditForm initialYoutubeId={data.youtubeId} />}
    </div>
  );
}

function EditForm({ initialYoutubeId }: { initialYoutubeId: string }) {
  const editSubmission = useEditSubmission();
  const [videoUrl, setVideoUrl] = useState(
    `https://www.youtube.com/watch?v=${initialYoutubeId}`,
  );
  const [videoError, setVideoError] = useState<string>();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const youtubeId = getYouTubeId(videoUrl);
    if (!videoUrl.trim()) {
      setVideoError("Please enter a YouTube video link");
      return;
    }
    if (!youtubeId) {
      setVideoError("Please enter a valid YouTube URL");
      return;
    }
    setVideoError(undefined);
    editSubmission.mutate(
      { body: { videoId: youtubeId } },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  };

  return (
    <VideoEditor
      videoUrl={videoUrl}
      onVideoUrlChange={(url) => {
        setVideoUrl(url);
        setSaved(false);
      }}
      videoError={videoError}
      onErrorClear={() => setVideoError(undefined)}
      headerAction={
        <Button
          onClick={handleSave}
          size="sm"
          className="gap-2"
          disabled={editSubmission.isPending}
        >
          {editSubmission.isPending ? (
            <>
              <LoaderIcon className="animate-spin" /> Saving...
            </>
          ) : saved ? (
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
  );
}
