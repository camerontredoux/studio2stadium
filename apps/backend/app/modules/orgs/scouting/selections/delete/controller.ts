import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { DeleteSelectionService } from "./service.ts";

export default class DeleteSelectionController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteSelectionService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event.",
      });
    }

    const selectionId = ctx.params.id;
    const row = await service.execute(
      ctx.orgEvent!.id,
      ctx.orgRoster.id,
      selectionId
    );

    if (!row) {
      return ctx.response.notFound({ message: "Selection not found." });
    }

    return ctx.response.ok(row);
  }
}
