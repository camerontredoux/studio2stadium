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
import { useRequestUpload } from "@/shared/images/api/mutations";
import { ImageUploadField } from "@/shared/images/components/image-upload-field";
import { uploadToCloudflare } from "@/utils/upload-to-cloudflare";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

interface ImageUploadDialogProps {
  onImageUploaded: (url: string) => void;
  trigger: React.ReactNode;
}

export function ImageUploadDialog({
  onImageUploaded,
  trigger,
}: ImageUploadDialogProps) {
  const { mutateAsync: requestUpload, isPending } = useRequestUpload();
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const isLoading = isPending || uploading;

  const handleUpload = async () => {
    if (files.length === 0) return;

    const file = files[0];

    try {
      const response = await requestUpload({
        body: {
          contentType: file.type,
          type: "feed",
        },
      });
      const { key, url } = response;

      setUploading(true);
      await uploadToCloudflare(url, file, setProgress);

      const imageUrl = `https://studio2stadium.com/img/${key}?type=feed`;
      onImageUploaded(imageUrl);

      toastManager.add({
        title: "Success",
        description: "Image uploaded",
        type: "success",
      });

      setIsOpen(false);
      setFiles([]);
      setProgress(0);
    } catch {
      toastManager.add({
        title: "Error",
        description: "Failed to upload image",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<span />}>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
          <DialogDescription>
            Upload an image to insert into your blog post.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <ImageUploadField
            value={files}
            onValueChange={setFiles}
            isLoading={isLoading}
            progress={progress}
          />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button
            disabled={isLoading || files.length === 0}
            onClick={handleUpload}
          >
            {isLoading ? <Spinner label="Uploading..." /> : "Insert Image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
