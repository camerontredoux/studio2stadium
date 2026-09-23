import type { EventTierCapability } from "#shared/org/event-tiers";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

const override = () => vine.boolean({ strict: true }).optional();

export const schema = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string().uuid(),
      eventId: vine.string().uuid(),
    }),
    /**
     * The event's complete set of exceptions. A capability left out has none,
     * and its Event Tier decides.
     */
    capabilityOverrides: vine.object({
      callbacks: override(),
      check_in: override(),
      school_selections: override(),
      video_library: override(),
    }),
  })
);

export type Validator = Infer<typeof schema>;

// A capability added to the Event Tier mapping must be accepted here too.
type Accepted = keyof Validator["capabilityOverrides"];
const everyCapabilityAccepted: [
  Exclude<EventTierCapability, Accepted>,
] extends [never]
  ? true
  : never = true;
void everyCapabilityAccepted;
