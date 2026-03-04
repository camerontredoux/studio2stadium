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
import { VideoUploadField } from "./video-upload-field";

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

const schema = z.object({
  files: z
    .array(z.custom<File>())
    .min(1, "Please select a video")
    .max(1, "Please select one video")
    .refine((files) => files.every((file) => file.size < MAX_VIDEO_SIZE), {
      message: "File size must be less than 500MB",
    })
    .refine((files) => files.every((file) => file.type.startsWith("video/")), {
      message: "Please select a video file",
    }),
});

export type FormValues = z.infer<typeof schema>;

export function VideoUploadForm({
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
      description: "Failed to upload video",
      type: "error",
    });
  };

  return (
    <FormProvider {...form}>
      <form
        id="video-upload-form"
        onSubmit={(e) => form.handleSubmit(onSubmit, onError)(e)}
      >
        <Controller
          control={form.control}
          name="files"
          render={({ field }) => (
            <Field>
              <VideoUploadField
                value={field.value}
                onValueChange={field.onChange}
                isLoading={isLoading}
                progress={progress}
              />
            </Field>
          )}
        />
      </form>
    </FormProvider>
  );
}
