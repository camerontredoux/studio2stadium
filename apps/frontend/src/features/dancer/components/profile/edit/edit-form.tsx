import { BirthdayField } from "@/components/shared/birthday-field";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast-manager";
import { useUpdateProfile } from "@/features/dancer/api/mutations";
import { makeBirthday } from "@/utils/birthday";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { dancerQueries } from "../../../api/queries";
import { schemas } from "../../../api/schemas";

type EditFormSchema = z.infer<typeof schemas.updatePortfolio>;

export function EditForm({ username }: { username: string }) {
  const { data } = useSuspenseQuery(dancerQueries.profile(username));

  const { mutate, isPending } = useUpdateProfile(username);

  const form = useForm<EditFormSchema>({
    resolver: zodResolver(schemas.updatePortfolio),
    defaultValues: {
      biography: data.biography ?? "",
      gpa: data.gpa ?? "",
      gradYear: data.gradYear ?? "",
      trainingHours: data.trainingHours ?? "",
      highSchool: data.highSchool ?? "",
      studio: data.studio ?? "",
      instagram: data.instagram ?? "",
      tiktok: data.tiktok ?? "",
      youtube: data.youtube ?? "",
      skillLevel: data.skillLevel ?? "",
      teamLevel: data.teamLevel ?? "",
      location: data.location,
      birthday: data.birthday
        ? {
            month: parseInt(data.birthday.split("-")[1]),
            day: parseInt(data.birthday.split("-")[2]),
            year: parseInt(data.birthday.split("-")[0]),
          }
        : undefined,
    },
  });

  const onSubmit = (data: EditFormSchema) => {
    const birthday = makeBirthday(data.birthday);
    mutate(
      { body: { ...data, birthday } },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Profile updated",
          });
        },
      },
    );
  };

  return (
    <FormProvider {...form}>
      <form
        id="edit-profile-form"
        className="flex w-full flex-col gap-3"
        onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
      >
        <Controller
          control={form.control}
          name="biography"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Biography</FieldLabel>
              <Textarea {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="gpa"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>GPA</FieldLabel>
              <Input type="text" inputMode="numeric" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="gradYear"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Grad Year</FieldLabel>
              <Input type="text" inputMode="numeric" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="trainingHours"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Training Hours</FieldLabel>
              <Input type="text" inputMode="numeric" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="highSchool"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>High School</FieldLabel>
              <Input type="text" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="studio"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Studio</FieldLabel>
              <Input type="text" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="instagram"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Instagram</FieldLabel>
              <Input type="text" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="tiktok"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>TikTok</FieldLabel>
              <Input type="text" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="youtube"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>YouTube</FieldLabel>
              <Input type="text" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="skillLevel"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Skill Level</FieldLabel>
              <Input type="text" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="teamLevel"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Team Level</FieldLabel>
              <Input type="text" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="location"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Location</FieldLabel>
              <Input type="text" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="birthday"
          render={() => <BirthdayField name="birthday" />}
        />
      </form>
    </FormProvider>
  );
}
