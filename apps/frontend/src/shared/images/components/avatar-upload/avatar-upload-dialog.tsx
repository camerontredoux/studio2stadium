import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { uploadToCloudflare } from "@/utils/upload-to-cloudflare";
import { CameraIcon } from "lucide-react";
import { useState } from "react";
import { useRequestUpload, useUpdateAvatar } from "../../api/mutations";
import { AvatarUploadForm, type FormValues } from "./avatar-upload-form";

interface AvatarUploadProps {
  avatar: string | null;
  fallback: string;
}

export function AvatarUploadDialog({ avatar, fallback }: AvatarUploadProps) {
  const session = useSession();
  const { mutate, isPending } = useRequestUpload();
  const { mutate: updateAvatar, isPending: isUpdatingAvatar } = useUpdateAvatar(
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
      { body: { contentType: file.type, type: "avatar" } },
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
              updateAvatar(
                { body: { key: response.key } },
                {
                  onSuccess: () => {
                    toastManager.add({
                      title: "Success",
                      description: "Avatar updated successfully",
                      type: "success",
                    });
                    setIsOpen(false);
                  },
                },
              );
            })
            .catch((e) => {
              console.log(e);
              toastManager.add({
                title: "Error",
                description: "Failed to upload avatar",
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="bg-background relative z-20 rounded-full sm:absolute sm:top-28 sm:left-4">
        <div className="group absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 hover:bg-black/60">
          <CameraIcon className="text-white opacity-100" />
        </div>
        <Avatar className="size-20 rounded-full border object-cover sm:size-24">
          <AvatarImage
            src={avatar || undefined}
            alt="Profile picture"
            className="size-full object-cover"
          />
          <AvatarFallback className="text-primary flex items-center justify-center text-lg">
            {fallback}
          </AvatarFallback>
        </Avatar>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Upload {session.type === "dancer" ? "Avatar" : "School Logo"}
          </DialogTitle>
          <DialogDescription>
            Change your{" "}
            {session.type === "dancer" ? "profile picture" : "school logo"}
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <AvatarUploadForm
            isLoading={isLoading}
            progress={progress}
            onSubmit={onSubmit}
          />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button disabled={isLoading} type="submit" form="avatar-upload-form">
            {isLoading ? <Spinner label="Uploading..." /> : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
