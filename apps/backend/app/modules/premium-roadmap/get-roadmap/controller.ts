import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { GetRoadmapService } from "./service.ts";

export default class GetRoadmapController {
  @inject()
  async handle(ctx: HttpContext, service: GetRoadmapService) {
    const roadmap = await service.execute(ctx.session);

    return ctx.response.ok(roadmap);
  }
}
