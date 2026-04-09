import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { DateRange } from "react-day-picker";
import { z } from "zod";
import { client } from "@/lib/api/client";
import { adminQueries, type OrgEvent } from "@/features/org/api/admin-queries";
import { toastManager } from "@/components/ui/toast-manager";

const schema = z.object({
  name: z.string().min(1, "Required").max(160),
  dateRange: z.custom<DateRange>(
    (val) =>
      !!val &&
      typeof val === "object" &&
      (val as DateRange).from instanceof Date &&
      (val as DateRange).to instanceof Date,
    { message: "Pick a start and end date" },
  ),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  contactEmail: z.string().email("Invalid email").or(z.literal("")).optional(),
});

type Schema = z.infer<typeof schema>;

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function defaultsFrom(event: OrgEvent): Schema {
  return {
    name: event.name,
    dateRange: {
      from: parseYmd(event.startDate),
      to: parseYmd(event.endDate),
    },
    venueName: event.venueName ?? "",
    venueAddress: event.venueAddress ?? "",
    contactEmail: event.contactEmail ?? "",
  };
}

interface EditEventSheetProps {
  orgSlug: string;
  event: OrgEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEventSheet({
  orgSlug,
  event,
  open,
  onOpenChange,
}: EditEventSheetProps) {
  const qc = useQueryClient();

  const rawClient = client as unknown as {
    PATCH: (
      path: string,
      opts: { body: Record<string, unknown> },
    ) => Promise<{ data: OrgEvent }>;
  };

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await rawClient.PATCH(
        `/orgs/${orgSlug}/events/${event.id}`,
        { body },
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries(adminQueries.events(orgSlug));
      toastManager.add({ title: "Event updated", type: "success" });
      onOpenChange(false);
    },
    onError: () => {
      toastManager.add({ title: "Couldn't update event", type: "error" });
    },
  });

  const { control, handleSubmit, reset } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: defaultsFrom(event),
  });

  useEffect(() => {
    if (open) reset(defaultsFrom(event));
  }, [open, event, reset]);

  const onSubmit = (data: Schema) => {
    if (mutation.isPending) return;
    if (!data.dateRange.from || !data.dateRange.to) return;
    mutation.mutate({
      name: data.name,
      startDate: toYmd(data.dateRange.from),
      endDate: toYmd(data.dateRange.to),
      venueName: data.venueName || undefined,
      venueAddress: data.venueAddress || undefined,
      contactEmail: data.contactEmail || undefined,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup variant="inset">
        <SheetHeader>
          <SheetTitle>Edit event</SheetTitle>
          <SheetDescription>
            Update details for {event.name}
          </SheetDescription>
        </SheetHeader>
        <SheetContent>
          <form
            id="edit-event-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-4 pt-2 pb-4"
          >
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Event name</FieldLabel>
                  <Input autoFocus {...field} />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="dateRange"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Dates</FieldLabel>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start font-normal"
                        />
                      }
                    >
                      <CalendarIcon aria-hidden="true" />
                      {field.value?.from && field.value.to ? (
                        <>
                          {format(field.value.from, "LLL dd, y")} –{" "}
                          {format(field.value.to, "LLL dd, y")}
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          Pick a date range
                        </span>
                      )}
                    </PopoverTrigger>
                    <PopoverPopup>
                      <Calendar
                        defaultMonth={field.value?.from}
                        mode="range"
                        numberOfMonths={2}
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverPopup>
                  </Popover>
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="venueName"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Venue name</FieldLabel>
                  <Input {...field} placeholder="Hilton Palmer House" />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="venueAddress"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Venue address</FieldLabel>
                  <Textarea
                    {...field}
                    rows={2}
                    placeholder="17 E Monroe St, Chicago, IL"
                  />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="contactEmail"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Contact email</FieldLabel>
                  <Input
                    {...field}
                    type="email"
                    placeholder="events@example.com"
                  />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
          </form>
        </SheetContent>
        <SheetFooter>
          <SheetClose render={<Button variant="ghost" />}>Cancel</SheetClose>
          <Button
            type="submit"
            form="edit-event-form"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Spinner label="Saving..." />
            ) : (
              "Save changes"
            )}
          </Button>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}
