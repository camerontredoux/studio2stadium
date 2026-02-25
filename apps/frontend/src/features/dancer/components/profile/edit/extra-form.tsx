import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { dancerQueries } from "../../../api/queries";
import { schemas } from "../../../api/schemas";

export type ExtraFormData = z.infer<typeof schemas.updateExtra>;

interface ExtraFormProps {
  username: string;
  onSubmit: (data: ExtraFormData) => void;
}

export function ExtraForm({ username, onSubmit }: ExtraFormProps) {
  const { data } = useSuspenseQuery(dancerQueries.profile(username));

  const form = useForm({
    resolver: zodResolver(schemas.updateExtra),
    defaultValues: {
      trainingHours: data.trainingHours ?? undefined,
      highSchool: data.highSchool ?? "",
      studio: data.studio ?? "",
      skillLevel: data.skillLevel ?? "",
      teamLevel: data.teamLevel ?? "",
    },
  });

  return (
    <FormProvider {...form}>
      <form
        id="edit-extra-form"
        className="flex w-full flex-col gap-3"
        onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
      >
        <Controller
          control={form.control}
          name="trainingHours"
          render={({ field: { value, onChange, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Training Hours (per week)</FieldLabel>
              <NumberField
                value={value as number | undefined}
                onValueChange={(val) => onChange(val)}
                min={0}
                max={168}
              >
                <NumberFieldGroup>
                  <NumberFieldDecrement />
                  <NumberFieldInput />
                  <NumberFieldIncrement />
                </NumberFieldGroup>
              </NumberField>
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="highSchool"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>High School</FieldLabel>
              <Input type="text" value={value as string} {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="studio"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Studio</FieldLabel>
              <Input type="text" value={value as string} {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="skillLevel"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Skill Level</FieldLabel>
              <Input type="text" value={value as string} {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="teamLevel"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Team Level</FieldLabel>
              <Input type="text" value={value as string} {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
      </form>
    </FormProvider>
  );
}
