import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetSchoolsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const schools = await service.execute();

    return ctx.response.ok(schools);
  }
}
