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
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useSession } from "@/lib/session";
import { useSubscribed } from "@/lib/session/hooks/use-subscribed";
import {
  VideoUploadForm,
  type FormValues,
} from "@/shared/videos/components/video-upload-form";
import { uploadVideoTus } from "@/utils/upload-video-tus";
import { Link } from "@tanstack/react-router";
import { CrownIcon, VideoIcon } from "lucide-react";
import { useRef, useState } from "react";
import type * as tus from "tus-js-client";

const PREMIUM_VIDEO_LIMIT = 3;

interface VideoUploadDialogProps {
  videoCount: number;
}

export function VideoUploadDialog({ videoCount }: VideoUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const {
    data: { subscribed },
  } = useSubscribed();
  const { type } = useSession();

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const uploadRef = useRef<tus.Upload | null>(null);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
    }
    setOpen(isOpen);
    if (!isOpen) {
      setUploading(false);
      setProgress(0);
    }
  };

  const onSubmit = (data: FormValues) => {
    const file = data.files[0];
    setProgress(0);
    setUploading(true);

    const upload = uploadVideoTus({
      file,
      onProgress: setProgress,
      onSuccess: () => {
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

  const isFreeTierDancer = !subscribed && type === "dancer";
  const hasReachedLimit = videoCount >= PREMIUM_VIDEO_LIMIT;

  if (isFreeTierDancer || hasReachedLimit) {
    return (
      <div className="border-border group flex aspect-square flex-1 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed opacity-60">
        <div className="bg-muted rounded-full p-3">
          <VideoIcon className="text-muted-foreground size-6" />
        </div>
        <span className="text-muted-foreground text-sm font-medium">
          {hasReachedLimit
            ? `Limit ${PREMIUM_VIDEO_LIMIT}/${PREMIUM_VIDEO_LIMIT}`
            : "Video"}
        </span>
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
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Video</DialogTitle>
          <DialogDescription>
            Add a video to your profile. Max 2 minutes.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <VideoUploadForm
            isLoading={uploading}
            progress={progress}
            onSubmit={onSubmit}
          />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button disabled={uploading} type="submit" form="video-upload-form">
            {uploading ? <Spinner label="Uploading..." /> : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
