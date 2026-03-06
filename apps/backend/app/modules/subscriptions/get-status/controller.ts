import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { GetSubscriptionService } from "./service.ts";

export default class GetSubscriptionController {
  @inject()
  async handle(ctx: HttpContext, service: GetSubscriptionService) {
    const user = ctx.auth.getUserOrFail();

    const status = await service.execute(user.id);

    return ctx.response.ok(status);
  }
}
