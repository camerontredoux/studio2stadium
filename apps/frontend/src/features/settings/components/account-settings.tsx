import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { MaskInput } from "@/components/ui/mask-input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MailIcon, PhoneIcon } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { useUpdateAccount } from "../api/mutations";
import { accountQueries } from "../api/queries";
import { accountSchemas } from "../api/schemas";

type AccountSettingsSchema = z.infer<typeof accountSchemas.updateAccount>;

export function AccountSettings() {
  const { data } = useSuspenseQuery(accountQueries.account());

  const form = useForm({
    resolver: zodResolver(accountSchemas.updateAccount),
    defaultValues: {
      firstName: data.firstName,
      lastName: data.lastName,
      displayEmail: data.displayEmail,
      phone: data.phone,
      notifications: data.notifications,
    },
  });

  const { isDirty, isValid } = form.formState;

  const { mutate, isPending } = useUpdateAccount();

  const onSubmit = (body: AccountSettingsSchema) => {
    mutate(
      { body },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Updated account",
            type: "success",
          });
          form.reset(form.getValues());
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
            form.setError(field as keyof AccountSettingsSchema, {
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
        <Section
          title="Name"
          description="Used for your profile and in emails."
        >
          <Controller
            control={form.control}
            name="firstName"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>First Name</FieldLabel>
                <Input
                  placeholder="First name"
                  value={field.value}
                  onChange={field.onChange}
                />
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
                <Input
                  placeholder="Last name"
                  value={field.value}
                  onChange={field.onChange}
                />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
        </Section>

        <Separator />

        <Section
          title="Contact Preferences"
          description="Used for communication and identification."
        >
          <Controller
            control={form.control}
            name="displayEmail"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>Email</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <MailIcon className="size-3.5" />
                  </InputGroupAddon>
                  <Input
                    unstyled
                    type="email"
                    placeholder="Email address"
                    value={field.value}
                    onChange={field.onChange}
                  />
                </InputGroup>
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <Field
                className="sm:w-fit"
                name={field.name}
                invalid={fieldState.invalid}
              >
                <FieldLabel>Phone Number</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <PhoneIcon className="size-3.5" />
                  </InputGroupAddon>
                  <MaskInput
                    unstyled
                    type="tel"
                    mask="phone"
                    value={field.value ?? ""}
                    onValueChange={(_, unmaskedValue) => {
                      field.onChange(unmaskedValue);
                    }}
                  />
                </InputGroup>
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="notifications"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel className="flex flex-col items-start">
                  Notifications
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FieldLabel>
              </Field>
            )}
          />
        </Section>

        <div className="flex justify-end">
          <Button
            disabled={isPending || !isDirty || !isValid}
            type="submit"
            className="w-fit max-sm:w-full"
          >
            {isPending ? (
              <Spinner label="Updating profile..." />
            ) : (
              "Update Profile"
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
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
