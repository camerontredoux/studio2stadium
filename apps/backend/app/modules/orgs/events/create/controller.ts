import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { CreateEventService } from "./service.ts";
import { schema } from "./validator.ts";
import { E_DATABASE_ERROR } from "#exceptions/database";
import {
  EventTierForbiddenError,
  EventTierRequiredError,
  isEventTierStaff,
} from "#shared/org/event-tier-authority";

export default class CreateEventController {
  @inject()
  async handle(ctx: HttpContext, service: CreateEventService) {
    const payload = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();
    try {
      const ev = await service.execute(ctx.org!.id, payload, user.id, {
        isStaff: isEventTierStaff(user),
      });
      return ctx.response.created(ev);
    } catch (err: any) {
      if (err instanceof EventTierForbiddenError) {
        return ctx.response.forbidden({ message: err.message });
      }
      if (err instanceof EventTierRequiredError) {
        return ctx.response.unprocessableEntity({ message: err.message });
      }
      if (
        err instanceof E_DATABASE_ERROR &&
        err.code === "E_UNIQUE_VIOLATION"
      ) {
        return ctx.response.conflict({
          message: "Another event is already active. Deactivate it first.",
        });
      }
      throw err;
    }
  }
}
