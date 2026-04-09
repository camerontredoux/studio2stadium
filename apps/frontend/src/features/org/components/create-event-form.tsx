import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { client } from "@/lib/api/client";
import { adminQueries, type OrgEvent } from "@/features/org/api/admin-queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import type { DateRange } from "react-day-picker";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Required").max(160),
  dateRange: z
    .custom<DateRange>(
      (val) =>
        !!val &&
        typeof val === "object" &&
        (val as DateRange).from instanceof Date &&
        (val as DateRange).to instanceof Date,
      { message: "Pick a start and end date" },
    ),
  venueName: z.string().optional(),
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

export function CreateEventForm({
  orgSlug,
  onCreated,
}: {
  orgSlug: string;
  onCreated?: (event: OrgEvent) => void;
}) {
  const qc = useQueryClient();

  const rawClient = client as unknown as {
    POST: (path: string, opts: { body: unknown }) => Promise<{ data: OrgEvent }>;
  };

  const createEvent = useMutation({
    mutationFn: async (body: {
      name: string;
      startDate: string;
      endDate: string;
      venueName?: string;
      isActive: boolean;
    }) => {
      const res = await rawClient.POST(`/orgs/${orgSlug}/events`, { body });
      return res.data;
    },
    onSuccess: (event) => {
      qc.invalidateQueries(adminQueries.events(orgSlug));
      onCreated?.(event);
    },
  });

  const { control, handleSubmit, reset } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      dateRange: undefined,
      venueName: "",
    },
  });

  const onSubmit = (data: Schema) => {
    if (createEvent.isPending) return;
    if (!data.dateRange.from || !data.dateRange.to) return;
    createEvent.mutate(
      {
        name: data.name,
        startDate: toYmd(data.dateRange.from),
        endDate: toYmd(data.dateRange.to),
        venueName: data.venueName || undefined,
        isActive: true,
      },
      { onSuccess: () => reset() },
    );
  };

  return (
    <form
      className="flex w-full flex-col gap-3"
      onSubmit={(e) => handleSubmit(onSubmit)(e)}
    >
      <Frame>
        <FramePanel className="flex w-full flex-col gap-3 sm:gap-5">
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
                    {field.value?.from ? (
                      field.value.to ? (
                        <>
                          {format(field.value.from, "LLL dd, y")} -{" "}
                          {format(field.value.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(field.value.from, "LLL dd, y")
                      )
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
                      disabled={{ before: today }}
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
                <FieldLabel>
                  Venue <span className="text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Input placeholder="Orlando Convention Center" {...field} />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
        </FramePanel>
      </Frame>
      <Button
        type="submit"
        disabled={createEvent.isPending}
        className="w-full"
      >
        {createEvent.isPending ? <Spinner label="Creating..." /> : "Create event"}
      </Button>
    </form>
  );
}
