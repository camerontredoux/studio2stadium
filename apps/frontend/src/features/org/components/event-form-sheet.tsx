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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast-manager";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, type Control } from "react-hook-form";
import type { DateRange } from "react-day-picker";
import { z } from "zod";
import { client } from "@/lib/api/client";
import { adminQueries, type OrgEvent } from "@/features/org/api/admin-queries";

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

const today = new Date();
today.setHours(0, 0, 0, 0);

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

function defaultsFromEvent(event: OrgEvent): Schema {
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

function emptyDefaults(): Schema {
  return {
    name: "",
    dateRange: undefined as unknown as Schema["dateRange"],
    venueName: "",
    venueAddress: "",
    contactEmail: "",
  };
}

function EventFormFields({
  control,
  calendarDisabledBeforeToday,
}: {
  control: Control<Schema>;
  calendarDisabledBeforeToday: boolean;
}) {
  return (
    <>
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <Field name={field.name} invalid={fieldState.invalid}>
            <FieldLabel>Event name</FieldLabel>
            <Input autoFocus placeholder="Spring Nationals 2026" {...field} />
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
                  disabled={
                    calendarDisabledBeforeToday ? { before: today } : undefined
                  }
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
            <Input {...field} type="email" placeholder="events@example.com" />
            <FieldError error={fieldState.error} />
          </Field>
        )}
      />
    </>
  );
}

const SHEET_FORM_ID = "org-event-sheet-form";
const CARD_FORM_ID = "org-event-card-form";

export interface EventFormSheetProps {
  orgSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to create a new event (same fields and chrome as edit). */
  event?: OrgEvent;
}

export function EventFormSheet({
  orgSlug,
  open,
  onOpenChange,
  event,
}: EventFormSheetProps) {
  const qc = useQueryClient();
  const isCreate = event === undefined;
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const bypassDirtyCheckRef = useRef(false);

  const rawClient = client as unknown as {
    POST: (
      path: string,
      opts: { body: unknown },
    ) => Promise<{ data: OrgEvent }>;
    PATCH: (
      path: string,
      opts: { body: Record<string, unknown> },
    ) => Promise<{ data: OrgEvent }>;
  };

  const createMutation = useMutation({
    mutationFn: async (body: {
      name: string;
      startDate: string;
      endDate: string;
      venueName?: string;
      venueAddress?: string;
      contactEmail?: string;
    }) => {
      const created = (
        await rawClient.POST(`/orgs/${orgSlug}/events`, {
          body: { ...body, isActive: false },
        })
      ).data;
      return (
        await rawClient.PATCH(`/orgs/${orgSlug}/events/${created.id}`, {
          body: { isActive: true },
        })
      ).data;
    },
    onSuccess: () => {
      qc.invalidateQueries(adminQueries.events(orgSlug));
      toastManager.add({ title: "Event created", type: "success" });
      bypassDirtyCheckRef.current = true;
      onOpenChange(false);
    },
    onError: () => {
      toastManager.add({ title: "Couldn't create event", type: "error" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      if (!event) {
        throw new Error("Event is required to update");
      }
      const res = await rawClient.PATCH(`/orgs/${orgSlug}/events/${event.id}`, {
        body,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries(adminQueries.events(orgSlug));
      toastManager.add({ title: "Event updated", type: "success" });
      bypassDirtyCheckRef.current = true;
      onOpenChange(false);
    },
    onError: () => {
      toastManager.add({ title: "Couldn't update event", type: "error" });
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: isCreate ? emptyDefaults() : defaultsFromEvent(event),
  });

  useEffect(() => {
    if (!open) return;
    reset(isCreate ? emptyDefaults() : defaultsFromEvent(event));
  }, [open, isCreate, event, reset]);

  const pending = isCreate
    ? createMutation.isPending
    : updateMutation.isPending;
  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    if (bypassDirtyCheckRef.current) {
      bypassDirtyCheckRef.current = false;
      setDiscardConfirmOpen(false);
      onOpenChange(false);
      return;
    }

    if (isDirty && !pending) {
      setDiscardConfirmOpen(true);
      return;
    }

    onOpenChange(false);
  };

  const handleDiscardChanges = () => {
    reset(isCreate ? emptyDefaults() : defaultsFromEvent(event));
    setDiscardConfirmOpen(false);
    onOpenChange(false);
  };

  const onSubmit = (data: Schema) => {
    if (pending) return;
    if (!data.dateRange.from || !data.dateRange.to) return;
    const payload = {
      name: data.name,
      startDate: toYmd(data.dateRange.from),
      endDate: toYmd(data.dateRange.to),
      venueName: data.venueName || undefined,
      venueAddress: data.venueAddress || undefined,
      contactEmail: data.contactEmail || undefined,
    };
    if (isCreate) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetPopup variant="inset">
          <SheetHeader>
            <SheetTitle>{isCreate ? "Create event" : "Edit event"}</SheetTitle>
            <SheetDescription>
              {isCreate
                ? "The new event becomes active; your previous event stays in history and you can switch back anytime."
                : `Update details for ${event.name}`}
            </SheetDescription>
          </SheetHeader>
          <SheetContent>
            <form
              id={SHEET_FORM_ID}
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5 px-4 pt-2 pb-4"
            >
              <EventFormFields
                control={control}
                calendarDisabledBeforeToday={isCreate}
              />
            </form>
          </SheetContent>
          <SheetFooter>
            <SheetClose render={<Button variant="ghost" />}>Cancel</SheetClose>
            <Button type="submit" form={SHEET_FORM_ID} disabled={pending}>
              {pending ? (
                <Spinner label={isCreate ? "Creating…" : "Saving…"} />
              ) : isCreate ? (
                "Create event"
              ) : (
                "Save changes"
              )}
            </Button>
          </SheetFooter>
        </SheetPopup>
      </Sheet>
      <AlertDialog
        open={discardConfirmOpen}
        onOpenChange={setDiscardConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to this event form. If you close now,
              your edits will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDiscardConfirmOpen(false)}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDiscardChanges}
            >
              Discard changes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function CreateEventForm({
  orgSlug,
  onCreated,
}: {
  orgSlug: string;
  onCreated?: (event: OrgEvent) => void;
}) {
  const qc = useQueryClient();

  const rawClient = client as unknown as {
    POST: (
      path: string,
      opts: { body: unknown },
    ) => Promise<{ data: OrgEvent }>;
    PATCH: (
      path: string,
      opts: { body: { isActive: boolean } },
    ) => Promise<{ data: OrgEvent }>;
  };

  const createMutation = useMutation({
    mutationFn: async (body: {
      name: string;
      startDate: string;
      endDate: string;
      venueName?: string;
      venueAddress?: string;
      contactEmail?: string;
    }) => {
      const created = (
        await rawClient.POST(`/orgs/${orgSlug}/events`, {
          body: { ...body, isActive: false },
        })
      ).data;
      return (
        await rawClient.PATCH(`/orgs/${orgSlug}/events/${created.id}`, {
          body: { isActive: true },
        })
      ).data;
    },
    onSuccess: (ev) => {
      qc.invalidateQueries(adminQueries.events(orgSlug));
      onCreated?.(ev);
    },
    onError: () => {
      toastManager.add({ title: "Couldn't create event", type: "error" });
    },
  });

  const { control, handleSubmit, reset } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: emptyDefaults(),
  });

  const onSubmit = (data: Schema) => {
    if (createMutation.isPending) return;
    if (!data.dateRange.from || !data.dateRange.to) return;
    createMutation.mutate(
      {
        name: data.name,
        startDate: toYmd(data.dateRange.from),
        endDate: toYmd(data.dateRange.to),
        venueName: data.venueName || undefined,
        venueAddress: data.venueAddress || undefined,
        contactEmail: data.contactEmail || undefined,
      },
      { onSuccess: () => reset() },
    );
  };

  return (
    <form
      id={CARD_FORM_ID}
      className="flex w-full flex-col gap-3"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Frame>
        <FramePanel className="flex w-full flex-col gap-3 sm:gap-5">
          <EventFormFields control={control} calendarDisabledBeforeToday />
        </FramePanel>
      </Frame>
      <Button
        type="submit"
        form={CARD_FORM_ID}
        disabled={createMutation.isPending}
        className="w-full"
      >
        {createMutation.isPending ? (
          <Spinner label="Creating…" />
        ) : (
          "Create event"
        )}
      </Button>
    </form>
  );
}
