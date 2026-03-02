import { useAnchoredErrorToast } from "@/components/hooks/use-anchored-error-toast";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { MaskInput } from "@/components/ui/mask-input";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { useRequestUpload } from "@/shared/images/api/mutations";
import { ImageUploadField } from "@/shared/images/components/image-upload-field";
import { uploadToCloudflare } from "@/utils/upload-to-cloudflare";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { PhoneIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { useSubmitApplication } from "../api/mutations";

const formSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  files: z.array(z.custom<File>()).min(1, "Please upload an ID image").max(1),
});

type FormValues = z.infer<typeof formSchema>;

export function ApplicationForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mutateAsync: requestUpload, isPending } = useRequestUpload();
  const { mutate: submitApplication, isPending: isSubmitting } =
    useSubmitApplication();

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const isLoading = isPending || uploading || isSubmitting;

  const submitRef = useRef<HTMLButtonElement>(null);
  const errorToast = useAnchoredErrorToast(submitRef);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      files: [],
    },
  });

  const onSubmit = async (data: FormValues) => {
    const file = data.files[0];

    try {
      const { key, url } = await requestUpload({
        body: {
          contentType: file.type,
          type: "id",
        },
      });

      setUploading(true);
      await uploadToCloudflare(url, file, setProgress);
      setUploading(false);

      submitApplication(
        {
          body: { phone: data.phone, mediaId: key },
        },
        {
          onSuccess: async () => {
            toastManager.add({
              title: "Success",
              description: "Application submitted successfully",
              type: "success",
            });
            await queryClient.resetQueries({ queryKey: ["session"] });
            navigate({ to: "/settings/application", replace: true });
          },
          onError: handleApiError({
            onValidation(field, message) {
              form.setError(field as keyof FormValues, { message });
            },
            onError(error) {
              errorToast.show(error.message);
            },
          }),
        },
      );
    } catch {
      setUploading(false);
      errorToast.show("Failed to upload image. Please try again.");
    }
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
      >
        <Frame>
          <FramePanel className="flex flex-col gap-3">
            <Controller
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Phone Number</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <PhoneIcon className="size-3.5" />
                    </InputGroupAddon>
                    <MaskInput
                      unstyled
                      type="tel"
                      mask="phone"
                      value={field.value}
                      onValueChange={(_, unmaskedValue) => {
                        field.onChange(unmaskedValue);
                      }}
                    />
                  </InputGroup>
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />

            <p className="text-muted-foreground text-xs">
              Submit an image of your government or school issued identification
              (driver&apos;s license, passport, faculty badge, etc.) for
              verification purposes. This protects dancers and helps verify your
              identity before creating your account. Identification is securely
              stored and only accessible by administrators and will be deleted
              once your application is reviewed.
            </p>

            <Controller
              control={form.control}
              name="files"
              render={({ field, fieldState }) => (
                <Field invalid={fieldState.invalid}>
                  <ImageUploadField
                    value={field.value}
                    onValueChange={field.onChange}
                    isLoading={isLoading}
                    progress={progress}
                  />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
          </FramePanel>
        </Frame>

        <Button
          disabled={isLoading}
          ref={submitRef}
          type="submit"
          className="w-full"
        >
          {isLoading ? <Spinner label="Submitting..." /> : "Continue"}
        </Button>
      </form>
    </FormProvider>
  );
}
