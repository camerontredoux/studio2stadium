import { EVENT_TIERS, type EventTier } from "#shared/org/event-tiers";

/**
 * The metadata of the audit entry a hand change to an Org Event's Event Tier
 * writes. The update service writes it; the admin purchases list reads it back
 * to show who last changed the tier. Both sides go through this module so the
 * shape cannot drift between them.
 */
export type TierChangeAuditMetadata = {
  diff: { eventTier: { from: EventTier | null; to: EventTier } };
};

export function tierChangeAuditMetadata(
  from: EventTier | null,
  to: EventTier
): TierChangeAuditMetadata {
  return { diff: { eventTier: { from, to } } };
}

const isEventTier = (value: unknown): value is EventTier =>
  typeof value === "string" &&
  (EVENT_TIERS as readonly string[]).includes(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** The `from`/`to` of a tier-change audit entry, or null if not well formed. */
export function readTierChangeAudit(
  metadata: unknown
): TierChangeAuditMetadata["diff"]["eventTier"] | null {
  if (!isRecord(metadata) || !isRecord(metadata.diff)) return null;
  const tier = metadata.diff.eventTier;
  if (!isRecord(tier) || !isEventTier(tier.to)) return null;
  return { from: isEventTier(tier.from) ? tier.from : null, to: tier.to };
}
