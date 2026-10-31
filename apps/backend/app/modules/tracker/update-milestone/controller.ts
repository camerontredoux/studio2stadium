import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { UpdateTrackerMilestoneService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateTrackerMilestoneController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateTrackerMilestoneService) {
    const payload = await ctx.request.validateUsing(schema);

    const milestone = await service.execute(ctx.session.profileId, payload);
    if (!milestone) {
      return ctx.response.notFound({ message: "Tracker milestone not found" });
    }
    return ctx.response.ok(milestone);
  }
}
