import { DatabaseService } from "#database/service";
import { orgEvents } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq, ne } from "drizzle-orm";
import type { Validator } from "./validator.ts";
import type { AuditContext } from "#database/audit";
import { assertEventSchedule } from "../event-schedule.ts";

const SCHEDULE_KEYS = [
  "startDate",
  "endDate",
  "startTime",
  "endTime",
  "timezone",
] as const;

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
          ...(patch.selfCheckIn !== undefined && {
            selfCheckIn: patch.selfCheckIn,
          }),
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
