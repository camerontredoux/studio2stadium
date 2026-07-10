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
import { FeedUploadDialog } from "@/shared/images/components/feed-upload/feed-upload-dialog";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { VideoUploadDialog } from "./video-upload-dialog";

interface MediaDialogProps {
  imageCount: number;
  videoCount: number;
  youtubeCount: number;
  orgAccountTier?: string | null;
}

export function MediaDialog({
  imageCount,
  videoCount,
  youtubeCount,
  orgAccountTier,
}: MediaDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon-xs" variant="ghost" />}>
        <PlusIcon />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Add images and videos to your media gallery.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="flex items-center gap-4 px-2 py-4">
            <FeedUploadDialog
              imageCount={imageCount}
              orgAccountTier={orgAccountTier}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="bg-border h-12 w-px" />
              <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                or
              </span>
              <div className="bg-border h-12 w-px" />
            </div>
            <VideoUploadDialog
              videoCount={videoCount}
              youtubeCount={youtubeCount}
              orgAccountTier={orgAccountTier}
            />
          </div>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
