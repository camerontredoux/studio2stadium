import { EVENT_TIERS } from "#shared/org/event-tiers";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(160),
    startDate: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    venueName: vine.string().trim().optional(),
    venueAddress: vine.string().trim().optional(),
    contactEmail: vine.string().email().optional(),
    startTime: vine
      .string()
      .trim()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
    timezone: vine.string().trim().optional(),
    isActive: vine.boolean().optional(),
    /** S2S staff only — see `#shared/org/event-tier-authority`. */
    eventTier: vine.enum(EVENT_TIERS).optional(),
  })
);
export type Validator = Infer<typeof schema>;
