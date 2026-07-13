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
import { handleApiError } from "@/lib/api/errors";
import { useSession } from "@/lib/session";
import { useSubscribed } from "@/lib/session/hooks/use-subscribed";
import { uploadToCloudflare } from "@/utils/upload-to-cloudflare";
import { Link } from "@tanstack/react-router";
import { CrownIcon, ImageIcon } from "lucide-react";
import { useState } from "react";
import { useRequestUpload, useUploadImage } from "../../api/mutations";
import { FeedUploadForm, type FormValues } from "./feed-upload-form";

const FREE_TIER_IMAGE_LIMIT = 4;

interface FeedUploadDialogProps {
  imageCount: number;
  orgAccountTier?: string | null;
}

export function FeedUploadDialog({
  imageCount,
  orgAccountTier,
}: FeedUploadDialogProps) {
  const session = useSession();
  const {
    data: { subscribed },
  } = useSubscribed();
  const { mutate, isPending } = useRequestUpload();
  const { mutate: uploadImage, isPending: isUpdatingAvatar } = useUploadImage(
    session.type,
    session.username,
  );

  const [isOpen, setIsOpen] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const isLoading = uploading || isPending || isUpdatingAvatar;

  const onSubmit = (files: FormValues) => {
    const file = files.files[0];
    setProgress(0);
    mutate(
      { body: { contentType: file.type, type: "feed" } },
      {
        onError: handleApiError({
          onError: (error) => {
            toastManager.add({
              title: "Error",
              description: error.message,
              type: "error",
            });
          },
        }),
        onSuccess: async (response) => {
          setUploading(true);
          uploadToCloudflare(response.url, file, (percent) => {
            setProgress(percent);
          })
            .then(() => {
              uploadImage(
                { body: { key: response.key } },
                {
                  onSuccess: () => {
                    toastManager.add({
                      title: "Success",
                      description: "Image posted successfully!",
                      type: "success",
                    });
                    setIsOpen(false);
                  },
                },
              );
            })
            .catch(() => {
              toastManager.add({
                title: "Error",
                description: "Failed to upload image",
                type: "error",
              });
            })
            .finally(() => {
              setUploading(false);
            });
        },
      },
    );
  };

  const isOrgLimited =
    !subscribed && session.type === "dancer" && orgAccountTier === "limited";
  const usesFreeTierLimit =
    !subscribed && session.type === "dancer" && !isOrgLimited;
  const hasReachedLimit = imageCount >= FREE_TIER_IMAGE_LIMIT;

  if (isOrgLimited || (usesFreeTierLimit && hasReachedLimit)) {
    return (
      <div className="border-border group flex aspect-square flex-1 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed opacity-60">
        <div className="bg-muted rounded-full p-3">
          <ImageIcon className="text-muted-foreground size-6" />
        </div>
        <span className="text-muted-foreground text-center text-sm font-medium">
          {isOrgLimited
            ? "Photos unavailable for this organization tier"
            : `Limit ${FREE_TIER_IMAGE_LIMIT}/${FREE_TIER_IMAGE_LIMIT}`}
        </span>
        <Button
          className="hover:text-brand gap-2"
          variant="link"
          size="xs"
          render={<Link to="/checkout" />}
        >
          <CrownIcon className="text-brand size-3" /> Premium Only
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="border-border hover:border-primary/50 hover:bg-primary/5 group flex aspect-square flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition-colors"
          />
        }
      >
        <div className="bg-muted group-hover:bg-primary/10 rounded-full p-3 transition-colors">
          <ImageIcon className="text-muted-foreground group-hover:text-primary size-6 transition-colors" />
        </div>
        <span className="text-muted-foreground group-hover:text-foreground text-sm font-medium transition-colors">
          Image
        </span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload</DialogTitle>
          <DialogDescription>Add an image to your account.</DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <FeedUploadForm
            isLoading={isLoading}
            progress={progress}
            onSubmit={onSubmit}
          />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button disabled={isLoading} type="submit" form="feed-upload-form">
            {isLoading ? <Spinner label="Uploading..." /> : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
