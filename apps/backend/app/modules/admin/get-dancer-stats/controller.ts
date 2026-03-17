import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetDancerStatsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const stats = await service.execute();

    return ctx.response.ok(stats);
  }
}
