import { DatabaseService } from "#database/service";
import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq, isNotNull, ne } from "drizzle-orm";
import type { Validator } from "./validator.ts";
import type { AuditContext } from "#database/audit";
import { assertEventTierWrite } from "#shared/org/event-tier-authority";
import { markTierManagedIfBelowEnterprise } from "#shared/org/self-serve";
import { tierChangeAuditMetadata } from "./tier-change-audit.ts";
import { assertEventSchedule } from "../event-schedule.ts";

const SCHEDULE_KEYS = [
  "startDate",
  "endDate",
  "startTime",
  "endTime",
  "timezone",
] as const;

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

      // The schedule rules apply to the event as it will be, not to the patch
      // alone. They run only when the patch touches the schedule, so a stored
      // row from before these rules can still be renamed or activated. A
      // missing event falls through to the 404 below.
      const touchesSchedule = SCHEDULE_KEYS.some(
        (key) => patch[key] !== undefined
      );
      if (before && touchesSchedule) {
        const merged = <K extends "startTime" | "endTime" | "timezone">(
          key: K
        ) => (patch[key] !== undefined ? patch[key] || null : before[key]);
        assertEventSchedule({
          startDate: patch.startDate ?? before.startDate,
          endDate: patch.endDate ?? before.endDate,
          startTime: merged("startTime"),
          endTime: merged("endTime"),
          timezone: merged("timezone"),
        });
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
          ...(patch.startTime !== undefined && {
            startTime: patch.startTime || null,
          }),
          ...(patch.endTime !== undefined && {
            endTime: patch.endTime || null,
          }),
          ...(patch.timezone !== undefined && {
            timezone: patch.timezone || null,
          }),
          ...(patch.isActive !== undefined && { isActive: patch.isActive }),
          ...(patch.eventTier !== undefined && { eventTier: patch.eventTier }),
          ...(patch.selfCheckIn !== undefined && {
            selfCheckIn: patch.selfCheckIn,
          }),
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
        // Below Enterprise, it also makes the Org tier-managed for good.
        if (isTierChange) {
          await markTierManagedIfBelowEnterprise(tx, orgId, ev.eventTier);
          audit.log({
            action: "update",
            resource: "event",
            resourceId: ev.id,
            metadata: tierChangeAuditMetadata(
              before?.eventTier ?? null,
              ev.eventTier
            ),
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
