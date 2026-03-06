import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { HelpCircleIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

type FeedbackSchema = z.infer<typeof accountSchemas.feedback>;

const FEEDBACK_TYPES = [
  { value: "bug", label: "Report a Bug" },
  { value: "feature", label: "Feature Request" },
  { value: "improvement", label: "Suggestion" },
  { value: "other", label: "Other" },
] as const;

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const pathname = useLocation({ select: (location) => location.pathname });

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
          setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="icon" variant="secondary" className="rounded-full" />
        }
      >
        <HelpCircleIcon className="size-5" />
        <span className="sr-only">Send feedback</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
          <DialogDescription>
            Have a question, suggestion, or found a bug? Let us know.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <FormProvider {...form}>
            <form
              id="feedback-form"
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
            </form>
          </FormProvider>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form="feedback-form"
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? <Spinner /> : <SendIcon className="size-4" />}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
