import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { CreateTrackerMilestoneService } from "./service.ts";
import { schema } from "./validator.ts";

export default class CreateTrackerMilestoneController {
  @inject()
  async handle(ctx: HttpContext, service: CreateTrackerMilestoneService) {
    const payload = await ctx.request.validateUsing(schema);

    const milestone = await service.execute(ctx.session.profileId, payload);
    return ctx.response.created(milestone);
  }
}
