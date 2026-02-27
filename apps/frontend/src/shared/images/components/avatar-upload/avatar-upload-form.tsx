import { Button } from "@/components/ui/button";
import { Field, FieldDescription } from "@/components/ui/field";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { CloudUploadIcon, TrashIcon } from "lucide-react";
import {
  Controller,
  FormProvider,
  useForm,
  type FieldErrors,
} from "react-hook-form";
import { z } from "zod";
import { AvatarUploadCropper } from "./avatar-upload-cropper";

const schema = z.object({
  files: z
    .array(z.custom<File>())
    .min(1, "Please select an image")
    .max(1, "Please select one image")
    .refine((files) => files.every((file) => file.size < 10 * 1024 * 1024), {
      error: "File size must be less than 10MB",
    }),
});

export type FormValues = z.infer<typeof schema>;

export function AvatarUploadForm({
  onSubmit,
  progress,
  isLoading,
}: {
  onSubmit: (data: FormValues) => void;
  progress: number;
  isLoading: boolean;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      files: [],
    },
  });

  const onError = (errors: FieldErrors<FormValues>) => {
    if (errors.files) {
      toastManager.add({
        title: "Error",
        description: errors.files.message,
        type: "error",
      });
      return;
    }
    toastManager.add({
      title: "Error",
      description: "Failed to upload image",
      type: "error",
    });
  };

  return (
    <FormProvider {...form}>
      <form
        id="avatar-upload-form"
        onSubmit={(e) => form.handleSubmit(onSubmit, onError)(e)}
      >
        <Controller
          control={form.control}
          name="files"
          render={({ field }) => (
            <Field>
              <FileUpload
                value={field.value}
                onValueChange={field.onChange}
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
                {field.value?.length > 0 ? (
                  <FileUploadList>
                    {field.value?.map((file, index) => (
                      <FileUploadItem
                        key={index}
                        value={file}
                        className="flex-col"
                      >
                        <div className="flex w-full items-center gap-2">
                          <FileUploadItemPreview className="size-12 rounded-full object-cover max-sm:size-13" />
                          <FileUploadItemMetadata />
                          <div className="flex items-center gap-1">
                            <AvatarUploadCropper
                              image={file}
                              onCrop={(croppedFile) =>
                                field.onChange([croppedFile])
                              }
                            />
                            <FileUploadItemDelete asChild>
                              <Button variant="ghost" size="icon">
                                <TrashIcon className="text-destructive-foreground size-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </FileUploadItemDelete>
                          </div>
                        </div>
                        {isLoading && (
                          <Progress value={progress} className="w-full" />
                        )}
                      </FileUploadItem>
                    ))}
                  </FileUploadList>
                ) : (
                  <FileUploadDropzone className="flex-row flex-wrap border-dashed text-center text-sm">
                    <CloudUploadIcon className="size-4" />
                    Drag and drop or{" "}
                    <FileUploadTrigger asChild>
                      <Button variant="link" size="xs" className="px-0!">
                        Browse
                      </Button>
                    </FileUploadTrigger>
                    to upload
                  </FileUploadDropzone>
                )}
              </FileUpload>
              <FieldDescription>Max image size is 10MB.</FieldDescription>
            </Field>
          )}
        />
      </form>
    </FormProvider>
  );
}
