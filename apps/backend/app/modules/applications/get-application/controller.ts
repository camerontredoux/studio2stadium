import { E_NOT_FOUND } from "#exceptions/not-found";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetApplicationController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const data = await service.execute(ctx.session.profileId);

    if (!data) {
      throw new E_NOT_FOUND("Application not found");
    }

    return ctx.response.ok(data);
  }
}
