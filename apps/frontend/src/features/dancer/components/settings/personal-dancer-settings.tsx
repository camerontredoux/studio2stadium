import { BirthdayField } from "@/components/shared/birthday-field";
import LocationSelect from "@/components/shared/location-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { MaskInput } from "@/components/ui/mask-input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { makeBirthday } from "@/utils/birthday";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MailIcon, PhoneIcon } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { useUpdateDancerProfile } from "../../api/mutations";
import { dancerQueries } from "../../api/queries";
import { schemas } from "../../api/schemas";

type PersonalSettingsSchema = z.infer<typeof schemas.updateProfile>;

export function PersonalDancerSettings() {
  const { data } = useSuspenseQuery(dancerQueries.settings.profile());

  const [year, month, day] = data.birthday.split("-");

  const form = useForm<PersonalSettingsSchema>({
    resolver: zodResolver(schemas.updateProfile),
    defaultValues: {
      firstName: data.firstName,
      lastName: data.lastName,
      displayEmail: data.displayEmail,
      phone: data.phone,
      birthday: {
        day: Number(day),
        month: Number(month),
        year: Number(year),
      },
      location: data.location,
    },
  });

  const { isDirty, isValid } = form.formState;
  const { mutate, isPending } = useUpdateDancerProfile();

  const onSubmit = (body: PersonalSettingsSchema) => {
    const birthday = makeBirthday(body.birthday);

    mutate(
      { body: { ...body, birthday } },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Updated profile",
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
            form.setError(field as keyof PersonalSettingsSchema, {
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
        <Avatar className="size-16">
          <AvatarImage src={data.avatar ?? undefined} />
          <AvatarFallback>
            {data.firstName.slice(0, 1).toUpperCase()}
            {data.lastName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <Section
          title="Name"
          description="Your first and last name as they appear on your profile."
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
          title="Contact Information"
          description="How people and organizations can reach you."
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
        </Section>

        <Separator />

        <Section
          title="Contact Information"
          description="How people and organizations can reach you."
        >
          <Controller
            control={form.control}
            name="location"
            render={({ field, fieldState }) => (
              <Field
                className="sm:max-w-xs"
                name={field.name}
                invalid={fieldState.invalid}
              >
                <FieldLabel>Location</FieldLabel>
                <LocationSelect value={field.value} onChange={field.onChange} />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />

          <BirthdayField name="birthday" />
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
    <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-4">
      <div className="flex flex-col">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <div className="flex max-w-md flex-col gap-3">{children}</div>
    </div>
  );
}
