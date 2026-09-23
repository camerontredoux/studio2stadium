import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import {
  DeactivatedPurchaseActivateError,
  UpdateEventService,
  StartTimePairError,
} from "./service.ts";
import { schema } from "./validator.ts";
import {
  EventTierForbiddenError,
  isEventTierStaff,
} from "#shared/org/event-tier-authority";

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
      return ev ? ctx.response.ok(ev) : ctx.response.notFound();
    } catch (err) {
      if (err instanceof EventTierForbiddenError) {
        return ctx.response.forbidden({ message: err.message });
      }
      if (err instanceof DeactivatedPurchaseActivateError) {
        return ctx.response.conflict({ message: err.message });
      }
      if (err instanceof StartTimePairError) {
        return ctx.response.unprocessableEntity({ message: err.message });
      }
      throw err;
    }
  }
}
