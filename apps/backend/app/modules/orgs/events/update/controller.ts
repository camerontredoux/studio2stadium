import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import transmit from "@adonisjs/transmit/services/main";
import { UpdateEventService } from "./service.ts";
import { schema } from "./validator.ts";
import { orgDefaultTimezone, withEventInstants } from "#utils/event-time";
import { EventScheduleError } from "../event-schedule.ts";

export default class UpdateEventController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateEventService) {
    const payload = await ctx.request.validateUsing(schema);
    try {
      const ev = await service.execute(ctx.org!.id, ctx.params.id, payload, {
        eventId: ctx.params.id,
        actorId: ctx.auth.getUserOrFail().id,
      });
      // Open check-in desks swap between the scanner and the self check-in note.
      if (ev && payload.selfCheckIn !== undefined) {
        transmit.broadcast(`orgs/${ctx.org!.slug}/check-in`, {});
      }
      return ev
        ? ctx.response.ok(
            withEventInstants(ev, orgDefaultTimezone(ctx.org!.settings))
          )
        : ctx.response.notFound();
    } catch (err) {
      if (err instanceof EventScheduleError) {
        return ctx.response.unprocessableEntity({ message: err.message });
      }
      throw err;
    }
  }
}
