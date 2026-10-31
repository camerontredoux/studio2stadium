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
import { useSubmitFeedback } from "@/features/settings/api/mutations";
import { accountSchemas } from "@/features/settings/api/schemas";
import { handleApiError } from "@/lib/api/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "@tanstack/react-router";
import { SendIcon } from "lucide-react";
import { useEffect } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

type FeedbackSchema = z.infer<typeof accountSchemas.feedback>;

const FEEDBACK_TYPES = [
  { value: "bug", label: "Report a Bug" },
  { value: "feature", label: "Feature Request" },
  { value: "improvement", label: "Suggestion" },
  { value: "other", label: "Other" },
] as const;

interface FeedbackFormProps {
  /** Form id, so an external submit button (e.g. a dialog footer) can target it. */
  id?: string;
  /** Render the form's own submit button. Set false when a footer owns submit. */
  showSubmit?: boolean;
  onSuccess?: () => void;
  /** Surface the submit pending state to an external submit button. */
  onPendingChange?: (pending: boolean) => void;
}

export function FeedbackForm({
  id = "feedback-form",
  showSubmit = true,
  onSuccess,
  onPendingChange,
}: FeedbackFormProps) {
  const pathname = useLocation({ select: (location) => location.pathname });

  const form = useForm<FeedbackSchema>({
    resolver: zodResolver(accountSchemas.feedback),
    defaultValues: {
      type: "other",
      message: "",
    },
  });

  const { mutate, isPending } = useSubmitFeedback();

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const onSubmit = (data: FeedbackSchema) => {
    mutate(
      {
        body: {
          type: data.type,
          message: data.message,
          page: pathname,
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
          onSuccess?.();
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
        id={id}
        className="flex flex-col gap-3"
        onSubmit={form.handleSubmit(onSubmit)}
      >
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
        {showSubmit && (
          <Button
            type="submit"
            form={id}
            disabled={isPending}
            className="gap-2 self-end"
          >
            {isPending ? <Spinner /> : <SendIcon className="size-4" />}
            Send
          </Button>
        )}
      </form>
    </FormProvider>
  );
}
