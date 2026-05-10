import { CalendarPopover } from "@/components/ui/calendar-popover";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ThumbnailUpload } from "@/shared/images/components/thumbnail-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import {
  schemas,
  type GlobalEventFormData,
} from "@/features/admin/api/schemas";
import { EVENT_TYPE_ITEMS } from "@/utils/constants/event-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";

interface GlobalEventFormProps {
  onSubmit: (data: GlobalEventFormData) => void;
  formId?: string;
  defaultValues?: Partial<GlobalEventFormData>;
}

const today = new Date();
today.setHours(0, 0, 0, 0);

export function GlobalEventForm({
  onSubmit,
  formId = "global-event-form",
  defaultValues,
}: GlobalEventFormProps) {
  const form = useForm<GlobalEventFormData>({
    resolver: zodResolver(schemas.globalEvent),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      location: defaultValues?.location ?? "",
      website: defaultValues?.website ?? "",
      startTime: defaultValues?.startTime ?? "",
      endTime: defaultValues?.endTime ?? "",
      thumbnail: defaultValues?.thumbnail ?? "",
      organization: defaultValues?.organization ?? "",
      type: defaultValues?.type,
      startDate: defaultValues?.startDate,
      endDate: defaultValues?.endDate,
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
          name="organization"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Organization</FieldLabel>
              <Input type="text" placeholder="Organizing body" {...field} />
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
          name="website"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Website</FieldLabel>
              <Input type="url" placeholder="https://example.com" {...field} />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="thumbnail"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Thumbnail</FieldLabel>
              <ThumbnailUpload
                value={field.value}
                onChange={field.onChange}
                returnKey
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
      </form>
    </FormProvider>
  );
}
