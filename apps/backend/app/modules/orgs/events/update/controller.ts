import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import transmit from "@adonisjs/transmit/services/main";
import {
  DeactivatedPurchaseActivateError,
  UpdateEventService,
} from "./service.ts";
import { schema } from "./validator.ts";
import {
  EventTierForbiddenError,
  isEventTierStaff,
} from "#shared/org/event-tier-authority";
import { orgDefaultTimezone, withEventInstants } from "#utils/event-time";
import { EventScheduleError } from "../event-schedule.ts";

export default class UpdateEventController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateEventService) {
    const payload = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();
    try {
      const ev = await service.execute(
        ctx.org!.id,
        ctx.params.id,
        payload,
        { eventId: ctx.params.id, actorId: user.id },
        { isStaff: isEventTierStaff(user) }
      );
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
      if (err instanceof EventTierForbiddenError) {
        return ctx.response.forbidden({ message: err.message });
      }
      if (err instanceof DeactivatedPurchaseActivateError) {
        return ctx.response.conflict({ message: err.message });
      }
      if (err instanceof EventScheduleError) {
        return ctx.response.unprocessableEntity({ message: err.message });
      }
      throw err;
    }
  }
}
