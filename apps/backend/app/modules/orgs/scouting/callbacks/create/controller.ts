import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import transmit from "@adonisjs/transmit/services/main";
import { CreateCallbackService } from "./service.ts";
import { schema } from "./validator.ts";

export default class CreateCallbackController {
  @inject()
  async handle(ctx: HttpContext, service: CreateCallbackService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const payload = await ctx.request.validateUsing(schema);
    const row = await service.execute(
      ctx.orgEvent!.id,
      ctx.orgRoster.id,
      payload.dancerRosterId
    );

    transmit.broadcast(`orgs/${ctx.org!.slug}/callbacks`, {});

    return ctx.response.created(row);
  }
}
