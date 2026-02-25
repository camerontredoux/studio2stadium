import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { schemas } from "../../../api/schemas";

export type ReferenceFormData = z.infer<typeof schemas.createReference>;

interface ReferencesFormProps {
  onSubmit: (data: ReferenceFormData) => void;
}

export function ReferencesForm({ onSubmit }: ReferencesFormProps) {
  const form = useForm({
    resolver: zodResolver(schemas.createReference),
    defaultValues: {
      name: "",
      title: "",
      description: "",
    },
  });

  return (
    <FormProvider {...form}>
      <form
        id="create-reference-form"
        className="flex w-full flex-col gap-3"
        onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
      >
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Name</FieldLabel>
              <Input
                type="text"
                placeholder="Reference's full name"
                {...field}
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Title</FieldLabel>
              <Input
                type="text"
                placeholder="Coach, Director, etc."
                {...field}
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Description</FieldLabel>
              <Textarea placeholder="How do you know this person?" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
      </form>
    </FormProvider>
  );
}
