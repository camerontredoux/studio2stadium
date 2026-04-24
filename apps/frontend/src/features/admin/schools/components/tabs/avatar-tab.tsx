import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field } from "@/components/ui/field";
import { toastManager } from "@/components/ui/toast-manager";
import { useAdminUpdateSchoolAvatar } from "@/features/admin/api/mutations";
import { handleApiError } from "@/lib/api/errors";
import { AvatarUploadCropper } from "@/shared/images/components/avatar-upload/avatar-upload-cropper";
import { useRequestUpload } from "@/shared/images/api/mutations";
import { ImageUploadField } from "@/shared/images/components/image-upload-field";
import { uploadToCloudflare } from "@/utils/upload-to-cloudflare";
import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import type { TabHandle } from "./types";

const avatarSchema = z.object({
  files: z
    .array(z.custom<File>())
    .min(1, "Please select an image")
    .max(1, "Please select one image")
    .refine((files) => files.every((file) => file.size < 10 * 1024 * 1024), {
      message: "File size must be less than 10MB",
    }),
});

type AvatarFormData = z.infer<typeof avatarSchema>;

interface AvatarTabProps {
  username: string;
  currentAvatar: string | null;
  schoolName: string;
  onStateChange: (state: { isDirty: boolean; isPending: boolean }) => void;
}

export const AvatarTab = forwardRef<TabHandle, AvatarTabProps>(
  function AvatarTab({ username, currentAvatar, schoolName, onStateChange }, ref) {
    const { mutate: requestUpload, isPending: isRequesting } = useRequestUpload();
    const { mutate: updateAvatar, isPending: isUpdating } = useAdminUpdateSchoolAvatar(username);

    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const isLoading = uploading || isRequesting || isUpdating;

  const form = useForm<AvatarFormData>({
    resolver: zodResolver(avatarSchema),
    defaultValues: {
      files: [],
    },
  });

  const onSubmit = (data: AvatarFormData) => {
    const file = data.files[0];
    setProgress(0);

    requestUpload(
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
                {
                  params: { path: { username } },
                  body: { key: response.key },
                },
                {
                  onSuccess: () => {
                    toastManager.add({
                      title: "Success",
                      description: "Avatar updated successfully",
                      type: "success",
                    });
                    form.reset();
                  },
                  onError: () => {
                    toastManager.add({
                      title: "Error",
                      description: "Failed to update avatar",
                      type: "error",
                    });
                  },
                },
              );
            })
            .catch(() => {
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

  const selectedFiles = form.watch("files");
  const hasFile = selectedFiles.length > 0;

  useImperativeHandle(ref, () => ({
    save: () => form.handleSubmit(onSubmit)(),
    isDirty: hasFile,
    isPending: isLoading,
  }));

  useEffect(() => {
    onStateChange({ isDirty: hasFile, isPending: isLoading });
  }, [hasFile, isLoading, onStateChange]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar className="size-20 rounded-full border">
          <AvatarImage src={currentAvatar || undefined} alt={schoolName} />
          <AvatarFallback className="text-lg">
            {schoolName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{schoolName}</p>
          <p className="text-muted-foreground text-sm">Current avatar</p>
        </div>
      </div>

      <FormProvider {...form}>
        <form
          id="admin-avatar-form"
          className="flex-1"
          onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
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
    </div>
  );
});
