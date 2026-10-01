import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetEventTierPurchasesController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    return ctx.response.ok(await service.execute());
  }
}
