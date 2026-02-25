import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { dancerQueries } from "../../../api/queries";
import { schemas } from "../../../api/schemas";

export type ContactFormData = z.infer<typeof schemas.updateContact>;

interface ContactFormProps {
  username: string;
  onSubmit: (data: ContactFormData) => void;
}

export function ContactForm({ username, onSubmit }: ContactFormProps) {
  const { data } = useSuspenseQuery(dancerQueries.profile(username));

  const form = useForm<ContactFormData>({
    resolver: zodResolver(schemas.updateContact),
    defaultValues: {
      instagram: data.instagram ?? "",
      tiktok: data.tiktok ?? "",
      youtube: data.youtube ?? "",
    },
  });

  return (
    <FormProvider {...form}>
      <form
        id="edit-contact-form"
        className="flex w-full flex-col gap-3"
        onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
      >
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
      </form>
    </FormProvider>
  );
}
