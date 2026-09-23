import { DatabaseService } from "#database/service";
import { orgEvents } from "#database/schema/org-events";
import {
  readCapabilityOverride,
  readCapabilityOverrides,
} from "#shared/org/entitlement";
import { EVENT_TIER_CAPABILITIES } from "#shared/org/event-tiers";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import {
  toEventCapabilitiesView,
  type EventCapabilitiesView,
} from "../get-org-event-capabilities/service.ts";
import { Validator } from "./validator.ts";

/** How an override reads in the Org Event's audit log. */
function describeOverride(value: boolean | undefined): string {
  if (value === undefined) return "Event Tier";
  return value ? "on" : "off";
}

/**
 * The audit diff of an override change: one entry per capability whose
 * exception changed, from and to "on", "off" or "Event Tier".
 */
export function overrideChangeDiff(
  before: unknown,
  after: unknown
): Record<string, { from: string; to: string }> {
  const diff: Record<string, { from: string; to: string }> = {};
  for (const capability of EVENT_TIER_CAPABILITIES) {
    const from = readCapabilityOverride(before, capability);
    const to = readCapabilityOverride(after, capability);
    if (from !== to) {
      diff[`${capability} override`] = {
        from: describeOverride(from),
        to: describeOverride(to),
      };
    }
  }
  return diff;
}

/**
 * Sets one Org Event's capability overrides — the staff exceptions to what its
 * Event Tier includes (#109). The body replaces the event's overrides whole: a
 * capability left out goes back to its Event Tier.
 */
@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(
    { params, capabilityOverrides }: Validator,
    actorId: string
  ): Promise<EventCapabilitiesView | null> {
    const next = readCapabilityOverrides(capabilityOverrides);

    return this.db.withAudit(
      { eventId: params.eventId, actorId },
      async (tx, audit) => {
        const [before] = await tx
          .select({ capabilityOverrides: orgEvents.capabilityOverrides })
          .from(orgEvents)
          .where(
            and(
              eq(orgEvents.id, params.eventId),
              eq(orgEvents.orgId, params.id)
            )
          )
          .for("update");
        if (!before) return null;

        const [event] = await tx
          .update(orgEvents)
          .set({ capabilityOverrides: next })
          .where(eq(orgEvents.id, params.eventId))
          .returning();

        const diff = overrideChangeDiff(before.capabilityOverrides, next);
        if (Object.keys(diff).length > 0) {
          audit.log({
            action: "update",
            resource: "event",
            resourceId: params.eventId,
            metadata: { diff },
          });
        }

        return toEventCapabilitiesView(event!);
      }
    );
  }
}
