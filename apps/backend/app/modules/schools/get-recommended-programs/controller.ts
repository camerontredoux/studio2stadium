import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetRecommendedProgramsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const profileId = ctx.session.profileId;
    const debug = ctx.request.qs().debug === "true";
    const recommendations = await service.execute(profileId, { debug });
    return ctx.response.ok(recommendations);
  }
}
