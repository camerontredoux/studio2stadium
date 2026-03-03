import env from "#start/env";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { ForgotPasswordEvent } from "./event.ts";
import { forgotPasswordSchema } from "./schema.ts";
import { ForgotPasswordService } from "./service.ts";

export default class ForgotPasswordController {
  @inject()
  async handle(ctx: HttpContext, service: ForgotPasswordService) {
    const payload = await ctx.request.validateUsing(forgotPasswordSchema);

    const { token, userId, isAdmin } = await service.execute(payload);

    if (!token) {
      return ctx.response.noContent();
    }

    const resetUrl = `${env.get("SITE_URL")}/reset?token=${token}&userId=${userId}`;

    ForgotPasswordEvent.dispatch({
      email: payload.email,
      resetUrl,
      isAdmin,
    });

    return ctx.response.noContent();
  }
}
