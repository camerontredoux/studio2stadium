import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { schemas } from "../../../api/schemas";

export type AchievementFormData = z.infer<typeof schemas.createAchievement>;

interface AchievementsFormProps {
  onSubmit: (data: AchievementFormData) => void;
}

export function AchievementsForm({ onSubmit }: AchievementsFormProps) {
  const form = useForm({
    resolver: zodResolver(schemas.createAchievement),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  return (
    <FormProvider {...form}>
      <form
        id="create-achievement-form"
        className="flex w-full flex-col gap-3"
        onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
      >
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Title</FieldLabel>
              <Input
                type="text"
                placeholder="Award or achievement name"
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
              <Textarea
                placeholder="Details about this achievement"
                {...field}
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
      </form>
    </FormProvider>
  );
}
