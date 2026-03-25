import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast-manager";
import { useAdminUpdateSchoolAccount } from "@/features/admin/api/mutations";
import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import type { TabHandle } from "./types";

const accountSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  displayEmail: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountTabProps {
  username: string;
  displayEmail: string;
  onStateChange: (state: { isDirty: boolean; isPending: boolean }) => void;
}

export const AccountTab = forwardRef<TabHandle, AccountTabProps>(
  function AccountTab({ username, displayEmail, onStateChange }, ref) {
    const { mutate, isPending } = useAdminUpdateSchoolAccount();

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      displayEmail: displayEmail,
      phone: "",
    },
  });

  const onSubmit = (formData: AccountFormData) => {
    const filteredData = Object.fromEntries(
      Object.entries(formData).filter(([, v]) => v !== ""),
    );

    if (Object.keys(filteredData).length === 0) {
      toastManager.add({
        title: "Info",
        description: "No changes to save",
        type: "info",
      });
      return;
    }

    mutate(
      {
        params: { path: { username } },
        body: filteredData,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Account updated successfully",
            type: "success",
          });
          form.reset(form.getValues());
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to update account",
            type: "error",
          });
        },
      },
    );
  };

  useImperativeHandle(ref, () => ({
    save: () => form.handleSubmit(onSubmit)(),
    isDirty: form.formState.isDirty,
    isPending,
  }));

  useEffect(() => {
    onStateChange({ isDirty: form.formState.isDirty, isPending });
  }, [form.formState.isDirty, isPending, onStateChange]);

  return (
    <div className="h-full overflow-auto">
      <p className="text-muted-foreground mb-4 text-sm">
        Update the school&apos;s account information. Only fill in fields you want to change.
      </p>

      <FormProvider {...form}>
        <form
          id="admin-account-form"
          className="flex-1 space-y-4"
          onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="firstName"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>First Name</FieldLabel>
                  <Input {...field} placeholder="Leave blank to keep current" />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="lastName"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Last Name</FieldLabel>
                  <Input {...field} placeholder="Leave blank to keep current" />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="displayEmail"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>Display Email</FieldLabel>
                <Input {...field} type="email" />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>Phone</FieldLabel>
                <Input {...field} type="tel" placeholder="Leave blank to keep current" />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
        </form>
      </FormProvider>
    </div>
  );
});
