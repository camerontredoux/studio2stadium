import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { DeleteTrackerMilestoneService } from "./service.ts";
import { schema } from "./validator.ts";

export default class DeleteTrackerMilestoneController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteTrackerMilestoneService) {
    const payload = await ctx.request.validateUsing(schema);

    const deleted = await service.execute(ctx.session.profileId, payload);
    if (!deleted) {
      return ctx.response.notFound({ message: "Tracker milestone not found" });
    }
    return ctx.response.noContent();
  }
}
