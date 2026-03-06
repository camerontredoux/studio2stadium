import { CalendarPopover } from "@/components/ui/calendar-popover";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import { schemas, type SchoolEventFormData } from "@/features/admin/api/schemas";
import { EVENT_TYPE_ITEMS } from "@/utils/constants/event-types";
import {
  getDefaultTimezone,
  TIMEZONE_ITEMS,
} from "@/utils/constants/timezones";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";

interface SchoolEventFormProps {
  onSubmit: (data: SchoolEventFormData) => void;
  formId?: string;
}

const today = new Date();
today.setHours(0, 0, 0, 0);

export function SchoolEventForm({
  onSubmit,
  formId = "school-event-form",
}: SchoolEventFormProps) {
  const form = useForm<SchoolEventFormData>({
    resolver: zodResolver(schemas.schoolEvent),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      startTime: "",
      endTime: "",
      timezone: getDefaultTimezone(),
      website: "",
      address: "",
    },
  });

  return (
    <FormProvider {...form}>
      <form
        id={formId}
        className="flex w-full flex-col gap-3"
        onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
      >
        <Controller
          control={form.control}
          name="type"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Event Type</FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                items={EVENT_TYPE_ITEMS}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_ITEMS.map((item) => (
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
          name="title"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Title</FieldLabel>
              <Input type="text" placeholder="Event title" {...field} />
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
              <Textarea placeholder="Describe the event" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={form.control}
            name="startDate"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>Start Date</FieldLabel>
                <CalendarPopover
                  value={field.value}
                  onSelect={field.onChange}
                  placeholder="Select date"
                  labelVariant="P"
                  disabled={{ before: today }}
                />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="startTime"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>Start Time</FieldLabel>
                <TimePicker
                  value={field.value}
                  onValueChange={field.onChange}
                />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={form.control}
            name="endDate"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>End Date</FieldLabel>
                <CalendarPopover
                  value={field.value}
                  onSelect={field.onChange}
                  placeholder="Select date"
                  labelVariant="P"
                  disabled={{ before: today }}
                />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="endTime"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>End Time</FieldLabel>
                <TimePicker
                  value={field.value}
                  onValueChange={field.onChange}
                />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="timezone"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Timezone</FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                items={TIMEZONE_ITEMS}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_ITEMS.map((item) => (
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
          name="location"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Location</FieldLabel>
              <Input
                type="text"
                placeholder="Venue or location name"
                {...field}
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="address"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>
                Address <span className="text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Input type="text" placeholder="Full address" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="website"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>
                Website <span className="text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Input type="url" placeholder="https://example.com" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
      </form>
    </FormProvider>
  );
}
