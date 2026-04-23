import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { CreateSelectionService } from "./service.ts";
import { schema } from "./validator.ts";

export default class CreateSelectionController {
  @inject()
  async handle(ctx: HttpContext, service: CreateSelectionService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event.",
      });
    }

    const payload = await ctx.request.validateUsing(schema);
    const result = await service.execute(
      ctx.orgEvent!.id,
      ctx.orgRoster.id,
      payload.coachRosterId
    );

    if ("error" in result) {
      return ctx.response.unprocessableEntity({
        message:
          "You can only select up to 3 schools. Remove one to add another.",
      });
    }

    return ctx.response.created(result.data);
  }
}
