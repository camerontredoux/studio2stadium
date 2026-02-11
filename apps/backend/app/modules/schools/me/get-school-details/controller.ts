import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetSchoolDetailsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const session = ctx.auth.getUserOrFail();

    const data = await service.execute(session.id);

    return ctx.response.ok(data);
  }
}
