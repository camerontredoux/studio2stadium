import env from "#start/env";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import mail from "@adonisjs/mail/services/main";
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

    const resetPasswordUrl = `${env.get("SITE_URL")}/reset?token=${token}&userId=${userId}`;

    await mail.send((message) => {
      message
        .to(payload.email)
        .subject("Reset Password")
        .html(
          `<p>You requested a password reset. Visit <a href="${resetPasswordUrl}">this link</a> to reset your password.</p>`
        )
        .text(
          `You requested a password reset. Visit ${resetPasswordUrl} to reset your password.`
        );
    });

    return ctx.response.noContent();
  }
}
