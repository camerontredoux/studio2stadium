import { Field } from "@/components/ui/field";
import { toastManager } from "@/components/ui/toast-manager";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  FormProvider,
  useForm,
  type FieldErrors,
} from "react-hook-form";
import { z } from "zod";
import { ImageUploadField } from "../image-upload-field";
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
              <ImageUploadField
                value={field.value}
                onValueChange={field.onChange}
                isLoading={isLoading}
                progress={progress}
                renderActions={(file, onChange) => (
                  <AvatarUploadCropper
                    image={file}
                    onCrop={(croppedFile) => onChange([croppedFile])}
                  />
                )}
              />
            </Field>
          )}
        />
      </form>
    </FormProvider>
  );
}
