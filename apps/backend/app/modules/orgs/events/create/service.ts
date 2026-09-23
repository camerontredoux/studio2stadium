import { DatabaseService } from "#database/service";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { inject } from "@adonisjs/core";
import type { Validator } from "./validator.ts";
import { AuditCollector } from "#database/audit";
import { desc, eq } from "drizzle-orm";
import { organizations } from "#database/schema/organizations";
import type { Transaction } from "#database/service";
import {
  readCapabilityOverrides,
  type CapabilityOverrides,
} from "#shared/org/entitlement";
import {
  assertEventTierWrite,
  assertMayCreateOrgEvent,
} from "#shared/org/event-tier-authority";
import {
  markTierManagedIfBelowEnterprise,
  readOrgEventCreation,
} from "#shared/org/self-serve";

@inject()
export class CreateEventService {
  constructor(private db: DatabaseService) {}

  /**
   * `by.isStaff` says whether S2S staff are creating the event: only they
   * may set its Event Tier, and they must (see `assertEventTierWrite`).
   * Everyone else may create events only in a grandfathered Org, where the
   * event takes the Enterprise column default as it always has (see
   * `assertMayCreateOrgEvent`). Staff creating one below Enterprise make the
   * Org tier-managed, which closes that door for good.
   */
  async execute(
    orgId: string,
    input: Validator,
    actorId: string,
    by: { isStaff: boolean } = { isStaff: false }
  ) {
    assertEventTierWrite({
      isStaff: by.isStaff,
      eventTier: input.eventTier,
      mode: "create",
    });

    // Create the event first in a transaction, then log the audit entry
    // using the new event's id as the eventId context
    return this.db.tx(async (tx) => {
      const org = await readOrgEventCreation(tx, orgId);
      const orgIsSelfServe = org.selfServe;
      assertMayCreateOrgEvent({
        isStaff: by.isStaff,
        orgIsSelfServe,
        orgIsTierManaged: org.tierManaged,
      });

      const [ev] = await tx
        .insert(orgEvents)
        .values({
          orgId,
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          venueName: input.venueName,
          venueAddress: input.venueAddress,
          contactEmail: input.contactEmail,
          isActive: input.isActive ?? false,
          ...(input.eventTier !== undefined && { eventTier: input.eventTier }),
          // A self-serve Org's events include what their Event Tier says until
          // staff decide otherwise, so they start with no exceptions.
          ...(!orgIsSelfServe && {
            capabilityOverrides: await grandfatheredOverrides(tx, orgId),
          }),
        })
        .returning();

      await markTierManagedIfBelowEnterprise(tx, orgId, ev!.eventTier);

      const [actor] = await tx
        .select({
          displayEmail: users.displayEmail,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, actorId))
        .limit(1);

      // The creator is an Organizer running the event, not a participant in it
      // (ADR 0003). Seed the row as a staff/preview roster so it anchors FKs and
      // matches what "view as coach" would provision, while staying out of every
      // participant-facing and aggregate query.
      if (actor) {
        await tx.insert(eventRosters).values({
          eventId: ev!.id,
          userId: actorId,
          type: "coach",
          email: actor.displayEmail,
          firstName: actor.firstName,
          lastName: actor.lastName,
          isStaff: true,
        });
      }

      const audit = new AuditCollector();
      audit.log({
        action: "create",
        resource: "event",
        resourceId: ev!.id,
        metadata: { after: ev },
      });
      await audit.flush(tx, { eventId: ev!.id, actorId });

      return ev!;
    });
  }
}

/**
 * The capability overrides a new event in a grandfathered Org starts with.
 *
 * Before overrides moved onto the Org Event (#109) they were org-wide, so a
 * new event in a hand-built Org took whatever the Org was configured with. It
 * still does: the overrides of the Org's most recently created event, or —
 * for an Org that had no event when they moved — the flags still on the Org.
 * Staff can change them per event afterwards.
 *
 * Known edge: events are hard-deleted, and the migration stripped the flags
 * from every Org that had an event. So if all of a migrated Org's events are
 * deleted, nothing is left to inherit and the next event starts with no
 * overrides — its Event Tier alone decides. This is accepted: access at
 * migration time is unchanged, and staff can set the exceptions on the new
 * event.
 */
async function grandfatheredOverrides(
  tx: Transaction,
  orgId: string
): Promise<CapabilityOverrides> {
  const [latest] = await tx
    .select({ capabilityOverrides: orgEvents.capabilityOverrides })
    .from(orgEvents)
    .where(eq(orgEvents.orgId, orgId))
    .orderBy(desc(orgEvents.createdAt))
    .limit(1);
  if (latest) return readCapabilityOverrides(latest.capabilityOverrides);

  const [org] = await tx
    .select({ features: organizations.features })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return readCapabilityOverrides(org?.features);
}
