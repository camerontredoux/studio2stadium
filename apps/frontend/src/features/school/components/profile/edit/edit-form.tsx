import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { schoolQueries } from "../../../api/queries";
import { schemas } from "../../../api/schemas";

export type EditFormData = z.infer<typeof schemas.updateAbout>;

interface EditFormProps {
  username: string;
  onSubmit: (data: EditFormData) => void;
}

export function EditForm({ username, onSubmit }: EditFormProps) {
  const { data } = useSuspenseQuery(schoolQueries.profile(username));

  const form = useForm({
    resolver: zodResolver(schemas.updateAbout),
    defaultValues: {
      about: data.about ?? "",
      missionStatement: data.missionStatement ?? "",
      whatWeDo: data.whatWeDo ?? "",
      benefits: data.benefits ?? "",
    },
  });

  return (
    <FormProvider {...form}>
      <form
        id="edit-about-form"
        className="flex w-full flex-col gap-3"
        onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
      >
        <Controller
          control={form.control}
          name="about"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>About</FieldLabel>
              <Textarea
                value={value as string}
                {...field}
                rows={4}
                placeholder="Tell us about your dance program..."
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="missionStatement"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Mission Statement</FieldLabel>
              <Textarea
                value={value as string}
                {...field}
                rows={3}
                placeholder="Your program's mission statement..."
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="whatWeDo"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>What We Do</FieldLabel>
              <Textarea
                value={value as string}
                {...field}
                rows={3}
                placeholder="Describe what your program does..."
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="benefits"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Benefits</FieldLabel>
              <Textarea
                value={value as string}
                {...field}
                rows={3}
                placeholder="Benefits of joining your program..."
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
      </form>
    </FormProvider>
  );
}
