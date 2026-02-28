import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { schoolQueries } from "../../../api/queries";
import { schemas } from "../../../api/schemas";

export type TeamFormData = z.infer<typeof schemas.updateTeam>;

interface TeamFormProps {
  username: string;
  onSubmit: (data: TeamFormData) => void;
}

export function TeamForm({ username, onSubmit }: TeamFormProps) {
  const { data } = useSuspenseQuery(schoolQueries.profile(username));

  const form = useForm({
    resolver: zodResolver(schemas.updateTeam),
    defaultValues: {
      size: data.size ?? undefined,
      gpa: data.gpa ?? undefined,
      timeCommitment: data.timeCommitment ?? "",
      headCoach: data.headCoach ?? "",
      assistantCoach: data.assistantCoach ?? "",
      commonRecruiting: data.commonRecruiting ?? false,
    },
  });

  return (
    <FormProvider {...form}>
      <form
        id="edit-team-form"
        className="flex w-full flex-col gap-3"
        onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
      >
        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={form.control}
            name="size"
            render={({ field: { value, onChange }, fieldState }) => (
              <Field name="size" invalid={fieldState.invalid}>
                <FieldLabel>Students</FieldLabel>
                <NumberField
                  value={value as number | undefined}
                  onValueChange={(val) => onChange(val)}
                  min={1}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement />
                    <NumberFieldInput placeholder="Number of students" />
                    <NumberFieldIncrement />
                  </NumberFieldGroup>
                </NumberField>
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="gpa"
            render={({ field: { value, onChange }, fieldState }) => (
              <Field name="gpa" invalid={fieldState.invalid}>
                <FieldLabel>GPA Requirement</FieldLabel>
                <NumberField
                  value={value as number | undefined}
                  onValueChange={(val) => onChange(val)}
                  min={0}
                  max={5}
                  step={0.1}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement />
                    <NumberFieldInput placeholder="GPA" />
                    <NumberFieldIncrement />
                  </NumberFieldGroup>
                </NumberField>
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
        </div>
        <Controller
          control={form.control}
          name="headCoach"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Head Coach</FieldLabel>
              <Input
                type="text"
                value={value as string}
                placeholder="Head coach name"
                {...field}
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="assistantCoach"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Assistant Coach</FieldLabel>
              <Input
                type="text"
                value={value as string}
                placeholder="Assistant coach name"
                {...field}
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="timeCommitment"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Time Commitment</FieldLabel>
              <Textarea
                value={value as string}
                rows={3}
                placeholder="Describe the weekly time commitment..."
                {...field}
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="commonRecruiting"
          render={({ field: { value, onChange, ...field } }) => (
            <Field name={field.name}>
              <label className="flex w-fit cursor-pointer items-center gap-2">
                <Checkbox
                  checked={value}
                  onCheckedChange={(checked) => onChange(checked === true)}
                />
                <span className="text-sm font-medium">
                  Participates in common recruiting
                </span>
              </label>
            </Field>
          )}
        />
      </form>
    </FormProvider>
  );
}
