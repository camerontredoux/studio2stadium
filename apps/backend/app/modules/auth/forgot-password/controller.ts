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

    const { token, userId } = await service.execute(payload);

    if (!token) {
      return ctx.response.noContent();
    }

    const resetUrl = `${env.get("SITE_URL")}/reset?token=${token}&userId=${userId}`;

    ctx.logger.info(`Reset password URL: ${resetUrl}`);

    ForgotPasswordEvent.dispatch({
      email: payload.email,
      resetUrl,
    });

    return ctx.response.noContent();
  }
}
