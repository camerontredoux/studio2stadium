import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toastManager } from "@/components/ui/toast-manager";
import { dancerQueries } from "@/features/dancer/api/queries";
import { schoolQueries } from "@/features/school/api/queries";
import { $api } from "@/lib/api/client";
import { useSession } from "@/lib/session";
import { useSubscribed } from "@/lib/session/hooks/use-subscribed";
import { useVideoProcessing } from "@/lib/video-processing";
import {
  VideoUploadForm,
  type FormValues,
} from "@/shared/videos/components/video-upload-form";
import { getYouTubeId } from "@/utils/get-youtube-id";
import { uploadVideoTus } from "@/utils/upload-video-tus";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CrownIcon, VideoIcon } from "lucide-react";
import { useRef, useState } from "react";
import type * as tus from "tus-js-client";

interface VideoUploadDialogProps {
  videoCount: number;
  orgAccountTier?: string | null;
}

export function VideoUploadDialog({ videoCount, orgAccountTier }: VideoUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"file" | "youtube">("file");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const {
    data: { subscribed },
  } = useSubscribed();
  const { type, username } = useSession();
  // Upload tiers (keyed off `subscribed`, which is true for either an active
  // Stripe subscription OR an active premium grant — both count as S2S premium):
  //  1. S2S premium → file + YouTube tabs (full upload)
  //  2. Org 'standard' roster dancer, not premium → YouTube-only (no file tab)
  //  3. Everyone else without premium (org 'limited' or plain free dancer)
  //     → locked "Premium Only"
  // Note: a premium user who is also org-provisioned gets full upload.
  const isOrgStandard = orgAccountTier === "standard";
  const isYoutubeOnly = !subscribed && isOrgStandard;
  const cloudflareLimit = 3;
  const hasReachedCloudflareLimit = videoCount >= cloudflareLimit;
  const { setIsProcessing } = useVideoProcessing();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const uploadRef = useRef<tus.Upload | null>(null);

  const youtubeUpload = $api.useMutation("post", "/videos/youtube", {
    onSuccess: () => {
      const profileQuery =
        type === "dancer"
          ? dancerQueries.profile(username)
          : schoolQueries.profile(username);
      queryClient.invalidateQueries({ queryKey: profileQuery.queryKey });
      toastManager.add({
        title: "Video added",
        description: "Your YouTube video has been added to your profile.",
        type: "success",
      });
      setOpen(false);
      setYoutubeUrl("");
    },
    onError: (error) => {
      toastManager.add({
        title: "Failed to add video",
        description: error.message || "Could not add the YouTube video",
        type: "error",
      });
    },
  });

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
    }
    setOpen(isOpen);
    if (!isOpen) {
      setUploading(false);
      setProgress(0);
      setYoutubeUrl("");
      setTab(hasReachedCloudflareLimit ? "youtube" : "file");
    }
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = getYouTubeId(youtubeUrl);
    if (!videoId) {
      toastManager.add({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        type: "error",
      });
      return;
    }
    youtubeUpload.mutate({ body: { videoId } });
  };

  const onSubmit = (data: FormValues) => {
    const file = data.files[0];
    setProgress(0);
    setUploading(true);

    const upload = uploadVideoTus({
      file,
      onProgress: setProgress,
      onSuccess: () => {
        setIsProcessing(true);
        toastManager.add({
          title: "Upload complete",
          description:
            "Your video is being processed. You'll be notified when it's ready.",
          type: "success",
        });
        setOpen(false);
        setUploading(false);
        setProgress(0);
        uploadRef.current = null;
      },
      onError: (error) => {
        toastManager.add({
          title: "Upload failed",
          description: error.message || "Failed to upload video",
          type: "error",
        });
        setUploading(false);
        uploadRef.current = null;
      },
    });

    uploadRef.current = upload;
    upload.start();
  };

  const isFreeTierDancer = !subscribed && !isOrgStandard && type === "dancer";

  if (isFreeTierDancer) {
    return (
      <div className="border-border group flex aspect-square flex-1 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed opacity-60">
        <div className="bg-muted rounded-full p-3">
          <VideoIcon className="text-muted-foreground size-6" />
        </div>
        <span className="text-muted-foreground text-sm font-medium">Video</span>
        {isFreeTierDancer && (
          <Button
            className="hover:text-brand gap-2"
            variant="link"
            size="xs"
            render={<Link to="/checkout" />}
          >
            <CrownIcon className="text-brand size-3" /> Premium Only
          </Button>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="border-border hover:border-primary/50 hover:bg-primary/5 group flex aspect-square flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition-colors"
          />
        }
      >
        <div className="bg-muted group-hover:bg-primary/10 rounded-full p-3 transition-colors">
          <VideoIcon className="text-muted-foreground group-hover:text-primary size-6 transition-colors" />
        </div>
        <span className="text-muted-foreground group-hover:text-foreground text-sm font-medium transition-colors">
          Video
        </span>
        {!isYoutubeOnly && hasReachedCloudflareLimit && (
          <span className="text-muted-foreground text-xs font-medium">
            Limit {cloudflareLimit}/{cloudflareLimit}
          </span>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Video</DialogTitle>
          <DialogDescription>Add a video to your profile.</DialogDescription>
        </DialogHeader>
        <DialogPanel>
          {isYoutubeOnly ? (
            <form id="youtube-upload-form" onSubmit={handleYoutubeSubmit}>
              <Field>
                <FieldLabel>YouTube URL</FieldLabel>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
              </Field>
            </form>
          ) : (
            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as "file" | "youtube")}
            >
              <TabsList className="w-full">
                <TabsTrigger
                  value="file"
                  className="flex-1"
                  disabled={hasReachedCloudflareLimit}
                >
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="youtube" className="flex-1">
                  YouTube Link
                </TabsTrigger>
              </TabsList>
              <TabsContent value="file" className="mt-4">
                {hasReachedCloudflareLimit ? (
                  <div className="bg-muted/40 text-muted-foreground rounded-md p-4 text-sm">
                    You have reached your cloud upload limit. You can still add
                    videos using a YouTube link.
                  </div>
                ) : (
                  <VideoUploadForm
                    isLoading={uploading}
                    progress={progress}
                    onSubmit={onSubmit}
                  />
                )}
              </TabsContent>
              <TabsContent value="youtube" className="mt-4">
                <form id="youtube-upload-form" onSubmit={handleYoutubeSubmit}>
                  <Field>
                    <FieldLabel>YouTube URL</FieldLabel>
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                    />
                  </Field>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          {isYoutubeOnly ? (
            <Button
              disabled={youtubeUpload.isPending || !youtubeUrl}
              type="submit"
              form="youtube-upload-form"
            >
              {youtubeUpload.isPending ? <Spinner label="Adding..." /> : "Add"}
            </Button>
          ) : tab === "file" ? (
            <Button disabled={uploading} type="submit" form="video-upload-form">
              {uploading ? <Spinner label="Uploading..." /> : "Upload"}
            </Button>
          ) : (
            <Button
              disabled={youtubeUpload.isPending || !youtubeUrl}
              type="submit"
              form="youtube-upload-form"
            >
              {youtubeUpload.isPending ? <Spinner label="Adding..." /> : "Add"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
