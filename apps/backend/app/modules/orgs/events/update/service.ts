import { DatabaseService } from "#database/service";
import { orgEvents } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq, ne } from "drizzle-orm";
import type { Validator } from "./validator.ts";
import type { AuditContext } from "#database/audit";

export class StartTimePairError extends Error {
  constructor() {
    super("startTime and timezone must be provided together or not at all.");
  }
}

@inject()
export class UpdateEventService {
  constructor(private db: DatabaseService) {}

  async execute(
    orgId: string,
    eventId: string,
    patch: Validator,
    auditCtx: AuditContext
  ) {
    return this.db.withAudit(auditCtx, async (tx, audit) => {
      // Read before state for diff
      const [before] = await tx
        .select()
        .from(orgEvents)
        .where(and(eq(orgEvents.id, eventId), eq(orgEvents.orgId, orgId)));

      // Validate startTime + timezone are provided together or not at all
      const newStartTime = patch.startTime !== undefined ? patch.startTime : before?.startTime ?? null;
      const newTimezone = patch.timezone !== undefined ? patch.timezone : before?.timezone ?? null;
      if ((newStartTime && !newTimezone) || (!newStartTime && newTimezone)) {
        throw new StartTimePairError();
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
        })
        .where(and(eq(orgEvents.id, eventId), eq(orgEvents.orgId, orgId)))
        .returning();

      if (ev) {
        const isActivateToggle =
          patch.isActive !== undefined && before?.isActive !== patch.isActive;

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
        } else {
          audit.log({
            action: "update",
            resource: "event",
            resourceId: ev.id,
            metadata: { before, after: ev },
          });
        }
      }

      return ev ?? null;
    });
  }
}
