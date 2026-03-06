import env from "#start/env";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class ManageController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const user = ctx.auth.getUserOrFail();

    const session = await service.execute(user.id);

    if (!session) {
      return ctx.response.redirect(`${env.get("SITE_URL")}/checkout`);
    }

    return ctx.response.ok(session);
  }
}
