import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetMySpotlightsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const spotlights = await service.execute(ctx.session.profileId);
    return ctx.response.ok(spotlights);
  }
}
