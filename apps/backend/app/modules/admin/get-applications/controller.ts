import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetApplicationsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const applications = await service.execute();

    return ctx.response.ok(applications);
  }
}
