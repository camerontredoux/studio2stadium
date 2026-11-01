import {} from "@phosphor-icons/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useRef, useState } from "react";
import { Controller, useForm, type Control } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/event/button";
import { Select } from "@/components/event/select";
import {
  DateRangePicker,
  type DateRange,
} from "@/components/event/date-range-picker";
import { Textarea } from "@/components/event/textarea";
import { TimeRangePicker } from "@/components/event/time-range-picker";
import { BusyLabel } from "@/features/org/live/shared/busy-label";
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import { client, type ApiSchemas } from "@/lib/api/client";
import {
  invalidateAfterLiveEventChange,
  invalidateOrgEvents,
  type OrgEvent,
} from "@/features/org/api/admin-queries";
import { AdminEventContext } from "@/features/org/context/admin-event-context";
import { useOrg } from "@/features/org/context/use-org";
import { ConfirmDialog } from "@/features/org/live/shared/confirm-dialog";
import { TimezoneCombobox } from "@/features/org/live/shared/timezone-combobox";
import {
  DetailSheet,
  DetailSheetFooter,
  DetailSheetForm,
  DetailSheetHeader,
  DetailSheetPrimary,
  DetailSheetSection,
} from "@/features/org/live/shared/detail-sheet";
import {
  formatRailDateRange,
  normalizeTime,
} from "@/features/org/live/shared/event-time";
import { localDateFromYmd } from "@/features/org/lib/event-clock";
import {
  canSetEventTier,
  EVENT_TIER_OPTIONS,
  EVENT_TIERS,
  eventTierLabel,
  type EventTier,
} from "@/lib/event-tiers";
import { useSession } from "@/lib/session";
import {
  SheetField,
  SheetFieldFrame,
} from "@/features/org/live/shared/sheet-field";

const timeValue = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:mm")
  .nullable();

// The same rules as the backend's `assertEventSchedule`: the hours apply to
// every event day, an end time needs a start time and comes after it, and the
// hours need a timezone.
const schema = z
  .object({
    name: z.string().min(1, "Required").max(160),
    dateRange: z.custom<DateRange>(
      (val) =>
        !!val &&
        typeof val === "object" &&
        (val as DateRange).start instanceof Date &&
        (val as DateRange).end instanceof Date,
      { message: "Pick a start and end date" },
    ),
    venueName: z.string().optional(),
    venueAddress: z.string().optional(),
    contactEmail: z
      .string()
      .email("Invalid email")
      .or(z.literal(""))
      .optional(),
    hours: z.object({ start: timeValue, end: timeValue }),
    timezone: z.string().optional(),
    eventTier: z.enum(EVENT_TIERS).optional(),
  })
  .superRefine((data, ctx) => {
    const { start, end } = data.hours;
    if (end && !start) {
      ctx.addIssue({
        code: "custom",
        path: ["hours"],
        message: "Pick a start time for the end time",
      });
    } else if (start && end && end <= start) {
      ctx.addIssue({
        code: "custom",
        path: ["hours"],
        message: "End the day after it starts",
      });
    }
    if (start && !data.timezone) {
      ctx.addIssue({
        code: "custom",
        path: ["timezone"],
        message: "Pick the timezone for the hours",
      });
    }
  });

type Schema = z.infer<typeof schema>;

/**
 * Staff creating an event must say which Event Tier was agreed: left blank, the
 * backend default would make it Enterprise, which is a grandfathering default
 * rather than a choice (ADR 0006).
 */
const staffCreateSchema = schema.refine((data) => data.eventTier !== undefined, {
  path: ["eventTier"],
  message: "Choose the Event Tier that was agreed",
});

/** How the Event Tier appears in the form, depending on who is looking. */
type EventTierMode = "editable" | "readonly" | "hidden";

const today = new Date();
today.setHours(0, 0, 0, 0);

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The event's daily hours, or nulls; old rows have no `endTime`. */
function hoursFromEvent(event: OrgEvent): Schema["hours"] {
  const start = normalizeTime(event.startTime);
  const end = start ? normalizeTime(event.endTime) : null;
  return { start, end };
}

/**
 * The hours and zone as the API takes them: all three when there is a start
 * time, else none (a zone without hours isn't stored).
 */
function scheduleBody(data: Schema) {
  const { start, end } = data.hours;
  if (!start || !data.timezone) {
    return { startTime: null, endTime: null, timezone: null };
  }
  return {
    startTime: start,
    endTime: end && end > start ? end : null,
    timezone: data.timezone,
  };
}

/** `scheduleBody` for create, which takes absent fields rather than nulls. */
function createScheduleBody(data: Schema) {
  const body = scheduleBody(data);
  return {
    startTime: body.startTime ?? undefined,
    endTime: body.endTime ?? undefined,
    timezone: body.timezone ?? undefined,
  };
}

function defaultsFromEvent(event: OrgEvent): Schema {
  return {
    name: event.name,
    dateRange: {
      start: localDateFromYmd(event.startDate),
      end: localDateFromYmd(event.endDate),
    },
    venueName: event.venueName ?? "",
    venueAddress: event.venueAddress ?? "",
    contactEmail: event.contactEmail ?? "",
    hours: hoursFromEvent(event),
    timezone: event.timezone ?? "",
    eventTier: event.eventTier,
  };
}

function emptyDefaults(defaultTimezone?: string): Schema {
  return {
    name: "",
    dateRange: { start: null, end: null },
    venueName: "",
    venueAddress: "",
    contactEmail: "",
    hours: { start: null, end: null },
    timezone: defaultTimezone ?? "",
    eventTier: undefined,
  };
}

// The pickers' chips, sized and inset like the sheet's 32px text inputs.
const pickerChips =
  "w-full [&>button]:h-(--control-lg) [&>button]:justify-start [&>button]:rounded-(--radius-6) [&>button]:bg-bg-300 [&>button]:px-[9px] [&>button:not([data-popup-open])]:border-line-control";

function ClearButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-label={label}
      className="-my-(--space-4) -me-(--space-8)"
    >
      Clear
    </Button>
  );
}

/** Search the common US zones first, then every IANA zone. */
function TimezoneField({
  name,
  value,
  onChange,
  error,
}: {
  name: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  return (
    <SheetFieldFrame
      label="Timezone"
      error={error}
      aside={
        value && (
          <ClearButton label="Clear timezone" onClick={() => onChange("")} />
        )
      }
    >
      <TimezoneCombobox
        name={name}
        size="lg"
        value={value}
        onChange={onChange}
        aria-invalid={error ? true : undefined}
      />
    </SheetFieldFrame>
  );
}

function EventTierField({
  control,
  mode,
}: {
  control: Control<Schema>;
  mode: EventTierMode;
}) {
  if (mode === "hidden") return null;
  return (
    <Controller
      control={control}
      name="eventTier"
      render={({ field, fieldState }) => (
        <SheetFieldFrame label="Event Tier" error={fieldState.error?.message}>
          {mode === "editable" ? (
            <Select
              size="lg"
              label="Event Tier"
              name={field.name}
              options={EVENT_TIER_OPTIONS}
              value={field.value ?? null}
              onChange={(value) =>
                field.onChange((value as EventTier | null) ?? undefined)
              }
              placeholder="Choose the Event Tier"
            />
          ) : (
            <p className="type-body text-fg m-0">
              {field.value ? eventTierLabel(field.value) : "None"}
              <span className="text-fg-3"> · set by Studio 2 Stadium</span>
            </p>
          )}
        </SheetFieldFrame>
      )}
    />
  );
}

/** The form's sections: Event, When, Where and Contact. */
function EventFormFields({
  control,
  calendarDisabledBeforeToday,
  eventTierMode,
}: {
  control: Control<Schema>;
  calendarDisabledBeforeToday: boolean;
  eventTierMode: EventTierMode;
}) {
  return (
    <>
      <DetailSheetSection title="Event">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <SheetField
              label="Event name"
              autoFocus
              autoComplete="off"
              placeholder="Spring Nationals 2026"
              name={field.name}
              ref={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <EventTierField control={control} mode={eventTierMode} />
      </DetailSheetSection>

      <DetailSheetSection title="When">
        <Controller
          control={control}
          name="dateRange"
          render={({ field, fieldState }) => (
            <SheetFieldFrame label="Dates" error={fieldState.error?.message}>
              <DateRangePicker
                value={field.value}
                onChange={field.onChange}
                minDate={calendarDisabledBeforeToday ? today : undefined}
                className={cn(
                  pickerChips,
                  fieldState.error &&
                    "[&>button:not([data-popup-open])]:border-danger",
                )}
              />
            </SheetFieldFrame>
          )}
        />
        <div className="bp-phone:grid-cols-1 grid grid-cols-2 items-start gap-(--space-12)">
          <Controller
            control={control}
            name="hours"
            render={({ field, fieldState }) => (
              <SheetFieldFrame
                label="Hours (each day)"
                error={fieldState.error?.message}
                aside={
                  (field.value.start || field.value.end) && (
                    <ClearButton
                      label="Clear hours"
                      onClick={() => field.onChange({ start: null, end: null })}
                    />
                  )
                }
              >
                <TimeRangePicker
                  value={field.value}
                  onChange={field.onChange}
                  startLabel="Daily start time"
                  endLabel="Daily end time"
                  startPlaceholder="--:--"
                  endPlaceholder="--:--"
                  className={cn(
                    pickerChips,
                    fieldState.error &&
                      "[&>button:not([data-popup-open])]:border-danger",
                  )}
                />
              </SheetFieldFrame>
            )}
          />
          <Controller
            control={control}
            name="timezone"
            render={({ field, fieldState }) => (
              <TimezoneField
                name={field.name}
                value={field.value ?? ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </DetailSheetSection>

      <DetailSheetSection title="Where">
        <Controller
          control={control}
          name="venueName"
          render={({ field, fieldState }) => (
            <SheetField
              label="Venue name"
              autoComplete="off"
              placeholder="Hilton Palmer House"
              name={field.name}
              ref={field.ref}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="venueAddress"
          render={({ field, fieldState }) => (
            <SheetFieldFrame
              label="Venue address"
              error={fieldState.error?.message}
            >
              <Textarea
                name={field.name}
                ref={field.ref}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                rows={2}
                placeholder="17 E Monroe St, Chicago, IL"
                className="has-aria-invalid:border-danger max-w-none"
              />
            </SheetFieldFrame>
          )}
        />
      </DetailSheetSection>

      <DetailSheetSection title="Contact">
        <Controller
          control={control}
          name="contactEmail"
          render={({ field, fieldState }) => (
            <SheetField
              label="Contact email"
              type="email"
              autoComplete="off"
              placeholder="events@example.com"
              name={field.name}
              ref={field.ref}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
      </DetailSheetSection>
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
  // Outside the admin area (no switcher) there is nothing to select.
  const adminEvent = useContext(AdminEventContext);
  const { settings } = useOrg();
  const defaultTimezone = (settings.defaultTimezone as string) ?? undefined;
  const isCreate = event === undefined;
  const isStaff = canSetEventTier(useSession());
  const eventTierMode: EventTierMode = isStaff
    ? "editable"
    : isCreate
      ? "hidden"
      : "readonly";
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const bypassDirtyCheckRef = useRef(false);

  const rawClient = client as any;

  const createMutation = useMutation({
    mutationFn: async (body: {
      name: string;
      startDate: string;
      endDate: string;
      venueName?: string;
      venueAddress?: string;
      contactEmail?: string;
      startTime?: string;
      endTime?: string;
      timezone?: string;
      eventTier?: EventTier;
    }) => {
      const createRes = await rawClient.POST(`/orgs/${orgSlug}/events`, {
        body: { ...body, isActive: false },
      });
      if (createRes.error) {
        // Surfaces the backend's reason, e.g. a self-serve Org's Organizer
        // being told new events are bought or arranged with S2S (#112).
        throw new Error(createRes.error.message ?? "Create failed");
      }
      const activateRes = await client.PATCH("/orgs/{slug}/events/{id}", {
        params: { path: { slug: orgSlug, id: createRes.data.id } },
        body: { isActive: true },
      });
      if (activateRes.error) throw new Error("Activate failed");
      return activateRes.data;
    },
    onSuccess: (ev) => {
      // A new event goes live: show it and refresh everything that followed
      // the old live event.
      adminEvent?.selectEvent(ev.id);
      void invalidateAfterLiveEventChange(qc);
      toastManager.add({ title: "Event created", type: "success" });
      bypassDirtyCheckRef.current = true;
      onOpenChange(false);
    },
    onError: (err) => {
      toastManager.add({
        title: "Couldn't create event",
        description: err.message,
        type: "error",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: ApiSchemas["OrgsIdEventsIdRequest"]) => {
      if (!event) {
        throw new Error("Event is required to update");
      }
      const res = await client.PATCH("/orgs/{slug}/events/{id}", {
        params: { path: { slug: orgSlug, id: event.id } },
        body,
      });
      if (res.error) {
        const msg =
          typeof res.error === "object" && res.error?.message
            ? res.error.message
            : "Update failed";
        throw new Error(msg);
      }
      return res.data;
    },
    onSuccess: () => {
      invalidateOrgEvents(qc, orgSlug);
      toastManager.add({ title: "Event updated", type: "success" });
      bypassDirtyCheckRef.current = true;
      onOpenChange(false);
    },
    onError: (err) => {
      toastManager.add({
        title: "Couldn't update event",
        description: err.message,
        type: "error",
      });
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<Schema>({
    resolver: zodResolver(isCreate && isStaff ? staffCreateSchema : schema),
    defaultValues: isCreate
      ? emptyDefaults(defaultTimezone)
      : defaultsFromEvent(event),
  });

  useEffect(() => {
    if (!open) return;
    reset(isCreate ? emptyDefaults(defaultTimezone) : defaultsFromEvent(event));
  }, [open, isCreate, event, reset, defaultTimezone]);

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
    if (!data.dateRange.start || !data.dateRange.end) return;
    if (isCreate) {
      createMutation.mutate({
        name: data.name,
        startDate: toYmd(data.dateRange.start),
        endDate: toYmd(data.dateRange.end),
        venueName: data.venueName || undefined,
        venueAddress: data.venueAddress || undefined,
        contactEmail: data.contactEmail || undefined,
        ...createScheduleBody(data),
        eventTier: isStaff ? data.eventTier : undefined,
      });
    } else {
      updateMutation.mutate({
        name: data.name,
        startDate: toYmd(data.dateRange.start),
        endDate: toYmd(data.dateRange.end),
        venueName: data.venueName || null,
        venueAddress: data.venueAddress || null,
        contactEmail: data.contactEmail || null,
        ...scheduleBody(data),
        // Only staff may send it; the backend refuses anyone else (#112).
        ...(isStaff && { eventTier: data.eventTier }),
      });
    }
  };

  return (
    <DetailSheet
      open={open}
      onOpenChange={handleSheetOpenChange}
      data-testid="event-form-sheet"
    >
      <DetailSheetHeader
        title={isCreate ? "New event" : "Edit event"}
        meta={
          isCreate ? undefined : `${event.name} · ${formatRailDateRange(event)}`
        }
        onClose={() => handleSheetOpenChange(false)}
      />
      <DetailSheetForm id={SHEET_FORM_ID} onSubmit={handleSubmit(onSubmit)}>
        <EventFormFields
          control={control}
          calendarDisabledBeforeToday={isCreate}
          eventTierMode={eventTierMode}
        />
      </DetailSheetForm>
      <DetailSheetFooter>
        <Button
          variant="ghost"
          size="lg"
          onClick={() => handleSheetOpenChange(false)}
          className="ms-auto"
        >
          Cancel
        </Button>
        <DetailSheetPrimary
          type="submit"
          form={SHEET_FORM_ID}
          disabled={pending}
        >
          {pending ? (
            <BusyLabel label={isCreate ? "Creating…" : "Saving…"} />
          ) : isCreate ? (
            "Create event"
          ) : (
            "Save changes"
          )}
        </DetailSheetPrimary>
      </DetailSheetFooter>
      <ConfirmDialog
        open={discardConfirmOpen}
        onOpenChange={setDiscardConfirmOpen}
        title="Discard changes?"
        description="You have unsaved changes to this event form. If you close now, your edits will be lost."
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        onConfirm={handleDiscardChanges}
      />
    </DetailSheet>
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
  // Outside the admin area (no switcher) there is nothing to select.
  const adminEvent = useContext(AdminEventContext);
  const { settings } = useOrg();
  const defaultTimezone = (settings.defaultTimezone as string) ?? undefined;
  const isStaff = canSetEventTier(useSession());

  const rawClient = client as any;

  const createMutation = useMutation({
    mutationFn: async (body: {
      name: string;
      startDate: string;
      endDate: string;
      venueName?: string;
      venueAddress?: string;
      contactEmail?: string;
      startTime?: string;
      endTime?: string;
      timezone?: string;
      eventTier?: EventTier;
    }) => {
      const createRes = await rawClient.POST(`/orgs/${orgSlug}/events`, {
        body: { ...body, isActive: false },
      });
      if (createRes.error) {
        // Surfaces the backend's reason, e.g. a self-serve Org's Organizer
        // being told new events are bought or arranged with S2S (#112).
        throw new Error(createRes.error.message ?? "Create failed");
      }
      const activateRes = await client.PATCH("/orgs/{slug}/events/{id}", {
        params: { path: { slug: orgSlug, id: createRes.data.id } },
        body: { isActive: true },
      });
      if (activateRes.error) throw new Error("Activate failed");
      return activateRes.data;
    },
    onSuccess: (ev) => {
      adminEvent?.selectEvent(ev.id);
      void invalidateAfterLiveEventChange(qc);
      onCreated?.(ev);
    },
    onError: (err) => {
      toastManager.add({
        title: "Couldn't create event",
        description: err.message,
        type: "error",
      });
    },
  });

  const { control, handleSubmit, reset } = useForm<Schema>({
    resolver: zodResolver(isStaff ? staffCreateSchema : schema),
    defaultValues: emptyDefaults(defaultTimezone),
  });

  const onSubmit = (data: Schema) => {
    if (createMutation.isPending) return;
    if (!data.dateRange.start || !data.dateRange.end) return;
    createMutation.mutate(
      {
        name: data.name,
        startDate: toYmd(data.dateRange.start),
        endDate: toYmd(data.dateRange.end),
        venueName: data.venueName || undefined,
        venueAddress: data.venueAddress || undefined,
        contactEmail: data.contactEmail || undefined,
        ...createScheduleBody(data),
        eventTier: isStaff ? data.eventTier : undefined,
      },
      { onSuccess: () => reset() },
    );
  };

  return (
    <form
      id={CARD_FORM_ID}
      noValidate
      className="flex w-full flex-col gap-(--space-12)"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="border-line bg-surface overflow-hidden rounded-(--radius-12) border">
        <EventFormFields
          control={control}
          calendarDisabledBeforeToday
          eventTierMode={isStaff ? "editable" : "hidden"}
        />
      </div>
      <Button
        type="submit"
        form={CARD_FORM_ID}
        variant="primary"
        size="lg"
        disabled={createMutation.isPending}
        className="w-full"
      >
        {createMutation.isPending ? (
          <BusyLabel label="Creating…" />
        ) : (
          "Create event"
        )}
      </Button>
    </form>
  );
}
