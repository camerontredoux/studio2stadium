import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetAllOrgsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const orgs = await service.execute();
    return ctx.response.ok(orgs);
  }
}
