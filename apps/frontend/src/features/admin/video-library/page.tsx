import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { getYouTubeId } from "@/utils/get-youtube-id";
import { useState } from "react";
import { useCreateLibraryVideo } from "./api/mutations";
import type { LibraryVideoFormData } from "./api/schemas";
import { VideoForm } from "./components/video-form";

export function VideoLibraryPage() {
  const { mutate: createVideo, isPending } = useCreateLibraryVideo();
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = (data: LibraryVideoFormData) => {
    const youtubeId = getYouTubeId(data.youtubeUrl);
    if (!youtubeId) return;

    createVideo(
      {
        body: {
          title: data.title,
          category: data.category,
          url: youtubeId,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Video added to library",
            type: "success",
          });
          setFormKey((k) => k + 1);
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to add video",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Add Training Video</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoForm key={formKey} onSubmit={handleSubmit} formId="video-form" />
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" size="sm" form="video-form" disabled={isPending}>
            {isPending ? <Spinner label="Adding..." /> : "Add Video"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
