import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Progress } from "@/components/ui/progress";
import { toastManager } from "@/components/ui/toast-manager";
import { CloudUploadIcon, TrashIcon, VideoIcon } from "lucide-react";

interface VideoUploadFieldProps {
  value: File[];
  onValueChange: (files: File[]) => void;
  isLoading: boolean;
  progress: number;
}

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_DURATION_SECONDS = 120; // 2 minutes

export function VideoUploadField({
  value,
  onValueChange,
  isLoading,
  progress,
}: VideoUploadFieldProps) {
  return (
    <>
      <FileUpload
        value={value}
        onValueChange={onValueChange}
        accept="video/*"
        maxFiles={1}
        maxSize={MAX_VIDEO_SIZE}
        onFileReject={(_, message) => {
          toastManager.add({
            title: "Error",
            description: message,
            type: "error",
          });
        }}
      >
        {value?.length > 0 ? (
          <FileUploadList>
            {value?.map((file, index) => (
              <FileUploadItem key={index} value={file} className="flex-col">
                <div className="flex w-full items-center gap-2">
                  <FileUploadItemPreview
                    className="size-12 rounded object-cover max-sm:size-13"
                    render={(file, fallback) => {
                      if (file.type.startsWith("video/")) {
                        return (
                          <div className="bg-muted flex size-full items-center justify-center">
                            <VideoIcon className="text-muted-foreground size-6" />
                          </div>
                        );
                      }
                      return fallback();
                    }}
                  />
                  <FileUploadItemMetadata />
                  <div className="flex items-center gap-1">
                    <FileUploadItemDelete asChild>
                      <Button variant="ghost" size="icon" disabled={isLoading}>
                        <TrashIcon className="text-destructive-foreground size-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </FileUploadItemDelete>
                  </div>
                </div>
                {isLoading && <Progress value={progress} className="w-full" />}
              </FileUploadItem>
            ))}
          </FileUploadList>
        ) : (
          <FileUploadDropzone className="flex-row flex-wrap border-dashed text-center text-sm">
            <CloudUploadIcon className="size-4" />
            Drag and drop or{" "}
            <FileUploadTrigger asChild>
              <Button variant="secondary" size="xs">
                Browse
              </Button>
            </FileUploadTrigger>
          </FileUploadDropzone>
        )}
      </FileUpload>
      <FieldDescription>
        Max video size is 500MB, up to {MAX_DURATION_SECONDS / 60} minutes.
      </FieldDescription>
    </>
  );
}
