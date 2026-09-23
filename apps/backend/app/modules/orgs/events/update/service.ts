import { DatabaseService } from "#database/service";
import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq, isNotNull, ne } from "drizzle-orm";
import type { Validator } from "./validator.ts";
import type { AuditContext } from "#database/audit";
import { assertEventTierWrite } from "#shared/org/event-tier-authority";

export class StartTimePairError extends Error {
  constructor() {
    super("startTime and timezone must be provided together or not at all.");
  }
}

/**
 * An Organizer tried to reactivate an Org Event whose purchase was refunded or
 * disputed. It was stood down for staff to resolve with the customer (ADR
 * 0005), so only staff may bring it back.
 */
export class DeactivatedPurchaseActivateError extends Error {
  constructor() {
    super(
      "This event's purchase was refunded or disputed. Contact Studio 2 Stadium to reactivate it."
    );
  }
}

function withoutTier<T extends { eventTier: unknown }>(
  row: T | undefined
): Omit<T, "eventTier"> | undefined {
  if (!row) return row;
  const { eventTier, ...rest } = row;
  return rest;
}

@inject()
export class UpdateEventService {
  constructor(private db: DatabaseService) {}

  async execute(
    orgId: string,
    eventId: string,
    patch: Validator,
    auditCtx: AuditContext,
    by: { isStaff: boolean } = { isStaff: false }
  ) {
    // Only S2S staff may change an Event Tier (it is what was paid for).
    assertEventTierWrite({
      isStaff: by.isStaff,
      eventTier: patch.eventTier,
      mode: "update",
    });

    return this.db.withAudit(auditCtx, async (tx, audit) => {
      // Read before state for diff. Lock the row so concurrent edits see a
      // consistent "from" value in the tier-change audit entry.
      const [before] = await tx
        .select()
        .from(orgEvents)
        .where(and(eq(orgEvents.id, eventId), eq(orgEvents.orgId, orgId)))
        .for("update");

      // Validate startTime + timezone are provided together or not at all
      const newStartTime =
        patch.startTime !== undefined
          ? patch.startTime
          : (before?.startTime ?? null);
      const newTimezone =
        patch.timezone !== undefined
          ? patch.timezone
          : (before?.timezone ?? null);
      if ((newStartTime && !newTimezone) || (!newStartTime && newTimezone)) {
        throw new StartTimePairError();
      }

      if (patch.isActive === true && !by.isStaff) {
        const [reversed] = await tx
          .select({ id: eventTierPurchases.id })
          .from(eventTierPurchases)
          .where(
            and(
              eq(eventTierPurchases.eventId, eventId),
              isNotNull(eventTierPurchases.deactivatedAt)
            )
          )
          .limit(1);
        if (reversed) throw new DeactivatedPurchaseActivateError();
      }

      // If activating this event, deactivate any other active event first
      if (patch.isActive === true) {
        await tx
          .update(orgEvents)
          .set({ isActive: false })
          .where(
            and(
              eq(orgEvents.orgId, orgId),
              eq(orgEvents.isActive, true),
              ne(orgEvents.id, eventId)
            )
          );
      }
      const [ev] = await tx
        .update(orgEvents)
        .set({
          ...(patch.name !== undefined && { name: patch.name }),
          ...(patch.startDate !== undefined && { startDate: patch.startDate }),
          ...(patch.endDate !== undefined && { endDate: patch.endDate }),
          ...(patch.venueName !== undefined && { venueName: patch.venueName }),
          ...(patch.venueAddress !== undefined && {
            venueAddress: patch.venueAddress,
          }),
          ...(patch.contactEmail !== undefined && {
            contactEmail: patch.contactEmail,
          }),
          ...(patch.schedulePdfUrl !== undefined && {
            schedulePdfUrl: patch.schedulePdfUrl,
          }),
          ...(patch.startTime !== undefined && { startTime: patch.startTime }),
          ...(patch.timezone !== undefined && { timezone: patch.timezone }),
          ...(patch.isActive !== undefined && { isActive: patch.isActive }),
          ...(patch.eventTier !== undefined && { eventTier: patch.eventTier }),
        })
        .where(and(eq(orgEvents.id, eventId), eq(orgEvents.orgId, orgId)))
        .returning();

      if (ev) {
        const isActivateToggle =
          patch.isActive !== undefined && before?.isActive !== patch.isActive;
        const isTierChange =
          patch.eventTier !== undefined &&
          before?.eventTier !== patch.eventTier;
        const changesMoreThanTier = Object.entries(patch).some(
          ([key, value]) => key !== "eventTier" && value !== undefined
        );

        // An Event Tier change is a commercial act, so it gets its own entry
        // naming what it changed from; the audit row carries who and when.
        if (isTierChange) {
          audit.log({
            action: "update",
            resource: "event",
            resourceId: ev.id,
            metadata: {
              diff: {
                eventTier: { from: before?.eventTier, to: ev.eventTier },
              },
            },
          });
        }

        if (isActivateToggle) {
          audit.log({
            action: "activate",
            resource: "event",
            resourceId: ev.id,
            metadata: {
              before: { isActive: before?.isActive },
              after: { isActive: ev.isActive },
            },
          });
        } else if (changesMoreThanTier) {
          // A tier change already has its own entry above; don't repeat it.
          audit.log({
            action: "update",
            resource: "event",
            resourceId: ev.id,
            metadata: isTierChange
              ? { before: withoutTier(before), after: withoutTier(ev) }
              : { before, after: ev },
          });
        }
      }

      return ev ?? null;
    });
  }
}
