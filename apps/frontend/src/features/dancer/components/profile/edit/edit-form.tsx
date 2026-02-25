import { BirthdayField } from "@/components/shared/birthday-field";
import LocationSelect from "@/components/shared/location-select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { dancerQueries } from "../../../api/queries";
import { schemas } from "../../../api/schemas";

export type EditFormData = z.infer<typeof schemas.updatePortfolio>;

interface EditFormProps {
  username: string;
  onSubmit: (data: EditFormData) => void;
}

export function EditForm({ username, onSubmit }: EditFormProps) {
  const { data } = useSuspenseQuery(dancerQueries.profile(username));

  const form = useForm({
    resolver: zodResolver(schemas.updatePortfolio),
    defaultValues: {
      biography: data.biography ?? "",
      gpa: data.gpa ?? undefined,
      gradYear: data.gradYear ?? undefined,
      location: data.location ?? "",
      birthday: data.birthday
        ? {
            month: parseInt(data.birthday.split("-")[1]),
            day: parseInt(data.birthday.split("-")[2]),
            year: parseInt(data.birthday.split("-")[0]),
          }
        : undefined,
    },
  });

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
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Biography</FieldLabel>
              <Textarea value={value as string} {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="gpa"
          render={({ field: { value, onChange, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>GPA</FieldLabel>
              <NumberField
                value={value as number | undefined}
                onValueChange={(val) => onChange(val)}
                min={0}
                max={5}
                step={0.1}
              >
                <NumberFieldGroup>
                  <NumberFieldDecrement />
                  <NumberFieldInput
                    inputMode="numeric"
                    maxLength={3}
                    minLength={1}
                    placeholder="GPA"
                  />
                  <NumberFieldIncrement />
                </NumberFieldGroup>
              </NumberField>
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="gradYear"
          render={({ field: { value, onChange, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Grad Year</FieldLabel>
              <NumberField
                format={{ useGrouping: false }}
                value={value as number | undefined}
                onValueChange={(val) => onChange(val)}
                min={2000}
                max={2040}
              >
                <NumberFieldGroup>
                  <NumberFieldInput
                    inputMode="numeric"
                    maxLength={4}
                    minLength={4}
                    placeholder="Year"
                  />
                </NumberFieldGroup>
              </NumberField>
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
              <LocationSelect value={field.value} onChange={field.onChange} />
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
