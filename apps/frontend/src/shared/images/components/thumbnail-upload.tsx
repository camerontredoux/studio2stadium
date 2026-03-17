import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toastManager } from "@/components/ui/toast-manager";
import { useRequestUpload } from "@/shared/images/api/mutations";
import { uploadToCloudflare } from "@/utils/upload-to-cloudflare";
import { ImageIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";

interface ThumbnailUploadProps {
  value: string;
  onChange: (value: string) => void;
  /** If true, returns only the media key instead of full URL */
  returnKey?: boolean;
}

export function ThumbnailUpload({ value, onChange, returnKey = false }: ThumbnailUploadProps) {
  const { mutateAsync: requestUpload } = useRequestUpload();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      const result = returnKey
        ? key
        : `https://studio2stadium.com/img/${key}?type=feed`;
      onChange(result);
    } catch {
      toastManager.add({
        title: "Error",
        description: "Failed to upload thumbnail",
        type: "error",
      });
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  if (value) {
    const previewUrl = value.startsWith("http")
      ? value
      : `https://studio2stadium.com/img/${value}?type=feed`;
    return (
      <div className="relative w-fit">
        <img
          src={previewUrl}
          alt="Thumbnail preview"
          className="h-32 w-auto rounded-lg object-cover"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute -right-2 -top-2 size-6"
          onClick={() => onChange("")}
        >
          <XIcon className="size-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="border-input hover:border-primary/50 hover:bg-primary/5 flex h-32 w-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
        <ImageIcon className="text-muted-foreground size-8" />
        <span className="text-muted-foreground text-sm">
          {uploading ? "Uploading..." : "Click to upload"}
        </span>
      </label>
      {uploading && <Progress value={progress} className="w-48" />}
    </div>
  );
}
