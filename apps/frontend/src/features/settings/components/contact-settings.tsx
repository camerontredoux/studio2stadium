import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { SendIcon } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { useSubmitFeedback } from "../api/mutations";
import { accountSchemas } from "../api/schemas";

type FeedbackSchema = z.infer<typeof accountSchemas.feedback>;

const FEEDBACK_TYPES = [
  { value: "bug", label: "Report a Bug" },
  { value: "feature", label: "Feature Request" },
  { value: "improvement", label: "Suggestion" },
  { value: "other", label: "Other" },
] as const;

export function ContactSettings() {
  const form = useForm<FeedbackSchema>({
    resolver: zodResolver(accountSchemas.feedback),
    defaultValues: {
      type: "other",
      message: "",
    },
  });

  const { mutate, isPending } = useSubmitFeedback();

  const onSubmit = (data: FeedbackSchema) => {
    mutate(
      {
        body: {
          type: data.type,
          message: data.message,
          page: window.location.pathname,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Message sent",
            description: "Thank you for your feedback!",
            type: "success",
          });
          form.reset();
        },
        onError: handleApiError({
          onError: (error) => {
            toastManager.add({
              title: "Error",
              description: error.message,
              type: "error",
            });
          },
        }),
      },
    );
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col gap-4 px-2 lg:gap-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-[1fr_2fr] lg:gap-x-8 lg:gap-y-4">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold">Contact Us</h2>
            <p className="text-muted-foreground text-xs">
              Have a question, suggestion, or found a bug? Let us know.
            </p>
          </div>
          <div className="flex max-w-md flex-col gap-3">
            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Type</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={FEEDBACK_TYPES}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FEEDBACK_TYPES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="message"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Message</FieldLabel>
                  <Textarea
                    placeholder="Tell us what's on your mind..."
                    {...field}
                  />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? <Spinner /> : <SendIcon className="size-4" />}
            Send
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
