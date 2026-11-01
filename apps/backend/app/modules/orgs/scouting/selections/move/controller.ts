import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { MoveSelectionService } from "./service.ts";
import { schema } from "./validator.ts";

export default class MoveSelectionController {
  @inject()
  async handle(ctx: HttpContext, service: MoveSelectionService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event.",
      });
    }

    const { params, direction } = await ctx.request.validateUsing(schema);
    const result = await service.execute(
      ctx.orgEvent!.id,
      ctx.orgRoster.id,
      params.id,
      direction
    );

    if ("error" in result) {
      if (result.error === "not_found") {
        return ctx.response.notFound({ message: "Selection not found." });
      }
      return ctx.response.unprocessableEntity({
        message:
          direction === "up"
            ? "This school is already your first choice."
            : "This school is already your last choice.",
      });
    }

    return ctx.response.ok(result.data);
  }
}
