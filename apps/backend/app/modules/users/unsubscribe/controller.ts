import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { UnsubscribeService } from "./service.ts";

export default class UnsubscribeController {
  @inject()
  async handle(ctx: HttpContext, service: UnsubscribeService) {
    const token = ctx.request.input("token");

    if (typeof token !== "string" || token.length === 0) {
      return ctx.response.badRequest({ message: "Missing unsubscribe token." });
    }

    const ok = await service.execute(token);

    if (!ok) {
      return ctx.response.badRequest({
        message: "This unsubscribe link is invalid or has expired.",
      });
    }

    return ctx.response.ok({
      message: "You have been unsubscribed from Studio 2 Stadium emails.",
    });
  }
}
