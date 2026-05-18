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
import { CalendarIcon, ChevronDownIcon, GlobeIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, type Control } from "react-hook-form";
import type { DateRange } from "react-day-picker";
import { z } from "zod";
import { client } from "@/lib/api/client";
import { adminQueries, type OrgEvent } from "@/features/org/api/admin-queries";

const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern (America/New_York)" },
  { value: "America/Chicago", label: "Central (America/Chicago)" },
  { value: "America/Denver", label: "Mountain (America/Denver)" },
  { value: "America/Los_Angeles", label: "Pacific (America/Los_Angeles)" },
  { value: "America/Phoenix", label: "Arizona (America/Phoenix)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Pacific/Honolulu)" },
  { value: "America/Anchorage", label: "Alaska (America/Anchorage)" },
];

const ALL_TIMEZONES: string[] = (() => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
})();

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
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use HH:mm format")
    .or(z.literal(""))
    .optional(),
  timezone: z.string().optional(),
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
    startTime: event.startTime ?? "",
    timezone: event.timezone ?? "",
  };
}

function emptyDefaults(): Schema {
  return {
    name: "",
    dateRange: undefined as unknown as Schema["dateRange"],
    venueName: "",
    venueAddress: "",
    contactEmail: "",
    startTime: "",
    timezone: "",
  };
}

function TimezoneField({
  name,
  value,
  onChange,
  invalid,
  error,
}: {
  name: string;
  value: string;
  onChange: (val: string) => void;
  invalid: boolean;
  error?: import("react-hook-form").FieldError;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const allOtherTimezones = useMemo(
    () => ALL_TIMEZONES.filter((tz) => !COMMON_TIMEZONES.some((c) => c.value === tz)),
    [],
  );

  const filterTz = (label: string) =>
    !search || label.toLowerCase().includes(search.toLowerCase());

  const filteredCommon = COMMON_TIMEZONES.filter((tz) => filterTz(tz.label));
  const filteredOther = allOtherTimezones.filter((tz) => filterTz(tz));

  const displayLabel = COMMON_TIMEZONES.find((tz) => tz.value === value)?.label ?? (value || undefined);

  return (
    <Field name={name} invalid={invalid} className="flex-1">
      <FieldLabel>Timezone</FieldLabel>
      <Popover open={open} onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setTimeout(() => searchRef.current?.focus(), 50);
        else setSearch("");
      }}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
            />
          }
        >
          <span className="flex items-center gap-2 truncate">
            <GlobeIcon aria-hidden="true" className="size-4 shrink-0 opacity-50" />
            <span className="truncate">
              {displayLabel ?? <span className="text-muted-foreground">Pick timezone</span>}
            </span>
          </span>
          <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverPopup align="start" className="w-72">
          <div className="flex flex-col gap-2">
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search timezones…"
              className="border-input bg-background placeholder:text-muted-foreground rounded-md border px-3 py-1.5 text-sm outline-none focus:ring-2"
            />
            <div className="max-h-56 overflow-y-auto">
              {filteredCommon.length > 0 && (
                <>
                  <p className="text-muted-foreground px-1 pb-1 text-xs font-medium">Common US</p>
                  {filteredCommon.map((tz) => (
                    <button
                      key={tz.value}
                      type="button"
                      className={`hover:bg-accent w-full rounded px-2 py-1.5 text-left text-sm ${value === tz.value ? "bg-accent font-medium" : ""}`}
                      onClick={() => { onChange(tz.value); setOpen(false); setSearch(""); }}
                    >
                      {tz.label}
                    </button>
                  ))}
                </>
              )}
              {filteredOther.length > 0 && (
                <>
                  <p className="text-muted-foreground mt-2 px-1 pb-1 text-xs font-medium">All timezones</p>
                  {filteredOther.map((tz) => (
                    <button
                      key={tz}
                      type="button"
                      className={`hover:bg-accent w-full rounded px-2 py-1.5 text-left text-sm ${value === tz ? "bg-accent font-medium" : ""}`}
                      onClick={() => { onChange(tz); setOpen(false); setSearch(""); }}
                    >
                      {tz}
                    </button>
                  ))}
                </>
              )}
              {filteredCommon.length === 0 && filteredOther.length === 0 && (
                <p className="text-muted-foreground px-2 py-4 text-center text-sm">No timezones found</p>
              )}
            </div>
            {value && (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground border-border border-t pt-2 text-left text-xs"
                onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
              >
                Clear timezone
              </button>
            )}
          </div>
        </PopoverPopup>
      </Popover>
      <FieldError error={error} />
    </Field>
  );
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
      <div className="flex gap-3">
        <Controller
          control={control}
          name="startTime"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid} className="flex-1">
              <FieldLabel>Start time</FieldLabel>
              <Input {...field} type="time" placeholder="09:00" />
              <FieldError error={fieldState.error} />
            </Field>
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
              invalid={fieldState.invalid}
              error={fieldState.error}
            />
          )}
        />
      </div>
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
      startTime?: string;
      timezone?: string;
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
    if (isCreate) {
      createMutation.mutate({
        name: data.name,
        startDate: toYmd(data.dateRange.from),
        endDate: toYmd(data.dateRange.to),
        venueName: data.venueName || undefined,
        venueAddress: data.venueAddress || undefined,
        contactEmail: data.contactEmail || undefined,
        startTime: data.startTime || undefined,
        timezone: data.timezone || undefined,
      });
    } else {
      updateMutation.mutate({
        name: data.name,
        startDate: toYmd(data.dateRange.from),
        endDate: toYmd(data.dateRange.to),
        venueName: data.venueName || null,
        venueAddress: data.venueAddress || null,
        contactEmail: data.contactEmail || null,
        startTime: data.startTime || null,
        timezone: data.timezone || null,
      });
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
      startTime?: string;
      timezone?: string;
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
        startTime: data.startTime || undefined,
        timezone: data.timezone || undefined,
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
