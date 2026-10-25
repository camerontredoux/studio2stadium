import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";
import { dateField, timeField, timezoneField } from "../event-schedule.ts";

// Field formats only. The rules across fields are `assertEventSchedule`, which
// the service runs on the stored event with this patch applied.
export const schema = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(160).optional(),
    startDate: dateField().optional(),
    endDate: dateField().optional(),
    venueName: vine.string().trim().optional(),
    venueAddress: vine.string().trim().optional(),
    contactEmail: vine.string().email().optional(),
    schedulePdfUrl: vine.string().optional().nullable(),
    startTime: timeField().optional().nullable(),
    endTime: timeField().optional().nullable(),
    timezone: timezoneField().optional().nullable(),
    isActive: vine.boolean().optional(),
  })
);
export type Validator = Infer<typeof schema>;
