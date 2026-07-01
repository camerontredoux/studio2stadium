import type { HttpContext } from "@adonisjs/core/http";
import { db } from "#database/connection";
import { orgEvents, eventRosters } from "#database/schema/org-events";
import { isCheckInOpen } from "#utils/event-time";
import { and, eq } from "drizzle-orm";

export default class CheckInStatusController {
  async handle(ctx: HttpContext) {
    const userId = ctx.auth.getUserOrFail().id;
    const eventId = ctx.params.id;

    const [event] = await db
      .select({
        startDate: orgEvents.startDate,
        startTime: orgEvents.startTime,
        timezone: orgEvents.timezone,
      })
      .from(orgEvents)
      .where(eq(orgEvents.id, eventId));

    const [roster] = await db
      .select({ checkedInAt: eventRosters.checkedInAt })
      .from(eventRosters)
      .where(
        and(
          eq(eventRosters.eventId, eventId),
          eq(eventRosters.userId, userId),
          eq(eventRosters.type, "dancer"),
        ),
      );

    const started = event
      ? isCheckInOpen(event.startDate, event.startTime, event.timezone)
      : false;

    return ctx.response.ok({
      checkedInAt: roster?.checkedInAt?.toISOString() ?? null,
      eventStartTime: event?.startTime ?? null,
      timezone: event?.timezone ?? null,
      canCheckIn: started && !roster?.checkedInAt,
    });
  }
}
