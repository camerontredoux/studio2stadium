import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { useUpdatePassword } from "../api/mutations";
import { accountSchemas } from "../api/schemas";

type PasswordSettingsSchema = z.infer<typeof accountSchemas.updatePassword>;

export function PasswordSettings() {
  const form = useForm<PasswordSettingsSchema>({
    mode: "onChange",
    resolver: zodResolver(accountSchemas.updatePassword),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const { isDirty, isValid } = form.formState;

  const { mutate, isPending } = useUpdatePassword();

  const onSubmit = (body: PasswordSettingsSchema) => {
    mutate(
      { body },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Password updated",
            type: "success",
          });
          form.reset();
        },
        onError: handleApiError({
          onError: (error) => {
            toastManager.add({
              title: "Error",
              description: error.message,
              type: "error",
            });
          },
          onValidation: (field, message) => {
            form.setError(field as keyof PasswordSettingsSchema, {
              message,
            });
          },
        }),
      },
    );
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
        className="flex flex-col gap-4 px-2 lg:gap-6"
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-[1fr_2fr] lg:gap-x-8 lg:gap-y-4">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold">Reset Password</h2>
            <p className="text-muted-foreground text-xs">
              Update your password to keep your account secure.
            </p>
          </div>
          <div className="flex max-w-md flex-col gap-3">
            <Controller
              control={form.control}
              name="currentPassword"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Current Password</FieldLabel>
                  <PasswordInput autoComplete="current-password" {...field} />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="newPassword"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>New Password</FieldLabel>
                  <PasswordInput autoComplete="new-password" {...field} />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            disabled={isPending || !isDirty || !isValid}
            type="submit"
            className="w-fit max-sm:w-full"
          >
            {isPending ? (
              <Spinner label="Updating password..." />
            ) : (
              "Update Password"
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
