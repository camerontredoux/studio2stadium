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
import { CloudUploadIcon, TrashIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ImageUploadFieldProps {
  value: File[];
  onValueChange: (files: File[]) => void;
  isLoading: boolean;
  progress: number;
  renderActions?: (file: File, onChange: (files: File[]) => void) => ReactNode;
}

export function ImageUploadField({
  value,
  onValueChange,
  isLoading,
  progress,
  renderActions,
}: ImageUploadFieldProps) {
  return (
    <>
      <FileUpload
        value={value}
        onValueChange={onValueChange}
        accept="image/*"
        maxFiles={1}
        maxSize={10 * 1024 * 1024}
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
                  <FileUploadItemPreview className="size-12 rounded-full object-cover max-sm:size-13" />
                  <FileUploadItemMetadata />
                  <div className="flex items-center gap-1">
                    {renderActions?.(file, onValueChange)}
                    <FileUploadItemDelete asChild>
                      <Button variant="ghost" size="icon">
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
      <FieldDescription>Max image size is 10MB.</FieldDescription>
    </>
  );
}
