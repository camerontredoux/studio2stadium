import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetSubmissionsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const data = await service.execute(ctx.session.profileId);

    return ctx.response.ok(data);
  }
}
