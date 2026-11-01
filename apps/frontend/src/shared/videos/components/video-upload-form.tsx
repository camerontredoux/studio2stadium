import { Field } from "@/components/ui/field";
import { toastManager } from "@/components/ui/toast-manager";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  FormProvider,
  useForm,
  type FieldErrors,
} from "react-hook-form";
import { videoUploadSchema, type FormValues } from "../schema";
import { VideoUploadField } from "./video-upload-field";

export type { FormValues } from "../schema";

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
    resolver: zodResolver(videoUploadSchema),
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
                isLoading={isLoading || form.formState.isSubmitting}
                progress={progress}
              />
            </Field>
          )}
        />
      </form>
    </FormProvider>
  );
}
