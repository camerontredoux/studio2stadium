import { useAnchoredErrorToast } from "@/components/hooks/use-anchored-error-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { useRequestUpload } from "@/shared/images/api/mutations";
import { ImageUploadField } from "@/shared/images/components/image-upload-field";
import { uploadToCloudflare } from "@/utils/upload-to-cloudflare";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { useUpdateApplication } from "../api/mutations";
import { accountQueries } from "../api/queries";

const formSchema = z.object({
  files: z.array(z.custom<File>()).min(1, "Please upload an ID image").max(1),
});

type FormValues = z.infer<typeof formSchema>;

const statusVariant = {
  pending: "warning",
  accepted: "success",
  rejected: "error",
} as const;

export function ApplicationSettings() {
  const { data: application } = useSuspenseQuery(
    accountQueries.application(),
  );
  const { data: account } = useSuspenseQuery(accountQueries.account());

  const { mutateAsync: requestUpload, isPending } = useRequestUpload();
  const { mutate: updateApplication, isPending: isUpdating } =
    useUpdateApplication();

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const isLoading = isPending || uploading || isUpdating;
  const canReupload =
    application.status === "pending" || application.status === "rejected";

  const submitRef = useRef<HTMLButtonElement>(null);
  const errorToast = useAnchoredErrorToast(submitRef);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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

      updateApplication(
        {
          body: { phone: account.phone ?? "", mediaId: key },
        },
        {
          onSuccess: () => {
            toastManager.add({
              title: "Success",
              description: "ID re-uploaded successfully",
              type: "success",
            });
            form.reset();
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
    <div className="flex flex-col gap-4 px-2 lg:gap-6">
      <Section
        title="Application Status"
        description="Your current application status."
      >
        <Badge className="w-fit capitalize" variant={statusVariant[application.status]}>
          {application.status}
        </Badge>

        {application.notes && (
          <Alert variant="default">
            <InfoIcon />
            <AlertTitle>Admin Notes</AlertTitle>
            <AlertDescription>{application.notes}</AlertDescription>
          </Alert>
        )}
      </Section>

      {canReupload && (
        <>
          <Separator />

          <Section
            title="Re-upload ID"
            description="Upload a new identification image for review."
          >
            <FormProvider {...form}>
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
              >
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

                <Button
                  disabled={isLoading}
                  ref={submitRef}
                  type="submit"
                  className="w-fit max-sm:w-full"
                >
                  {isLoading ? (
                    <Spinner label="Uploading..." />
                  ) : (
                    "Re-upload ID"
                  )}
                </Button>
              </form>
            </FormProvider>
          </Section>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-[1fr_2fr] lg:gap-x-8 lg:gap-y-4">
      <div className="flex flex-col">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <div className="flex max-w-md flex-col gap-3">{children}</div>
    </div>
  );
}
