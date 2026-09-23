import { EVENT_TIERS, type EventTier } from "#shared/org/event-tiers";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

/**
 * Enterprise has no fixed price and stays a sales conversation (ADR-adjacent
 * decision in the parent design doc, issue #84) — self-serve Checkout only
 * covers the other three Event Tiers.
 */
export const PURCHASABLE_EVENT_TIERS = EVENT_TIERS.filter(
  (tier): tier is Exclude<EventTier, "enterprise"> => tier !== "enterprise"
);

export type PurchasableEventTier = (typeof PURCHASABLE_EVENT_TIERS)[number];

/**
 * What the buyer describes about their purchase before paying. A function so
 * the checkout payload and the metadata read back off a completed session
 * (`metadata.ts`) each get their own schema nodes while agreeing on one shape.
 */
const purchaseFields = () => ({
  eventTier: vine.enum(PURCHASABLE_EVENT_TIERS),
  orgName: vine.string().trim().minLength(1).maxLength(128),
  eventName: vine.string().trim().minLength(1).maxLength(160),
  startDate: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const schema = vine.create(
  vine.object({
    userId: vine.string().uuid(),
    ...purchaseFields(),
  })
);

/** The purchase half of the payload, as it travels in session metadata. */
export const purchaseSchema = vine.create(vine.object(purchaseFields()));

export type Validator = Infer<typeof schema>;
