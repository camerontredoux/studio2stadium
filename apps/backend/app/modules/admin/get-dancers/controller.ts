import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetDancersController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const dancers = await service.execute();

    return ctx.response.ok(dancers);
  }
}
