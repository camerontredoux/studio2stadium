import { EVENT_TIERS } from "#shared/org/event-tiers";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";
import { dateField, timeField, timezoneField } from "../event-schedule.ts";

// Field formats only. The rules across fields (end date, the time and zone
// pair, the end time) are `assertEventSchedule`, which the service runs.
export const schema = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(160),
    startDate: dateField(),
    endDate: dateField(),
    venueName: vine.string().trim().optional(),
    venueAddress: vine.string().trim().optional(),
    contactEmail: vine.string().email().optional(),
    startTime: timeField().optional(),
    endTime: timeField().optional(),
    timezone: timezoneField().optional(),
    isActive: vine.boolean().optional(),
    /** S2S staff only — see `#shared/org/event-tier-authority`. */
    eventTier: vine.enum(EVENT_TIERS).optional(),
  })
);
export type Validator = Infer<typeof schema>;
