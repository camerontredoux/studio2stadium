import type { HttpContext } from "@adonisjs/core/http";
import { db } from "#database/connection";
import { orgEvents, eventRosters } from "#database/schema/org-events";
import { isCheckInOpen, orgDefaultTimezone } from "#utils/event-time";
import { and, eq } from "drizzle-orm";
import { signCheckInCode } from "./check-in-code.ts";

export default class CheckInStatusController {
  async handle(ctx: HttpContext) {
    const userId = ctx.auth.getUserOrFail().id;
    const eventId = ctx.params.id;

    const [event] = await db
      .select({
        orgId: orgEvents.orgId,
        startDate: orgEvents.startDate,
        endDate: orgEvents.endDate,
        startTime: orgEvents.startTime,
        endTime: orgEvents.endTime,
        timezone: orgEvents.timezone,
        selfCheckIn: orgEvents.selfCheckIn,
      })
      .from(orgEvents)
      .where(eq(orgEvents.id, eventId));

    const [roster] = await db
      .select({
        id: eventRosters.id,
        checkedInAt: eventRosters.checkedInAt,
        bibNumber: eventRosters.bibNumber,
      })
      .from(eventRosters)
      .where(
        and(
          eq(eventRosters.eventId, eventId),
          eq(eventRosters.userId, userId),
          eq(eventRosters.type, "dancer")
        )
      );

    const started = event
      ? isCheckInOpen(event, orgDefaultTimezone(ctx.org?.settings))
      : false;

    // The pass QR is only for the requester's own Roster Entry, on an event of
    // this org that has check-in.
    const features = (ctx.org?.features ?? {}) as Record<string, boolean>;
    const checkInCode =
      roster && event && event.orgId === ctx.org?.id && features.check_in
        ? signCheckInCode(roster.id, eventId)
        : null;

    return ctx.response.ok({
      checkedInAt: roster?.checkedInAt?.toISOString() ?? null,
      eventStartTime: event?.startTime ?? null,
      timezone: event?.timezone ?? null,
      canCheckIn: started && !roster?.checkedInAt,
      // Dancers check themselves in instead of showing the pass QR.
      selfCheckIn: event?.selfCheckIn ?? false,
      checkInCode,
      // The requester's own bib, shown on their pass. Never another dancer's.
      bibNumber: roster?.bibNumber ?? null,
    });
  }
}
