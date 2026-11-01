import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { DeleteTrackerItemService } from "./service.ts";
import { schema } from "./validator.ts";

export default class DeleteTrackerItemController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteTrackerItemService) {
    const payload = await ctx.request.validateUsing(schema);

    const deleted = await service.execute(ctx.session.profileId, payload);
    if (!deleted) {
      return ctx.response.notFound({ message: "Tracker item not found" });
    }
    return ctx.response.noContent();
  }
}
