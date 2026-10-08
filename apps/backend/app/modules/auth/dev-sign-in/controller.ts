import { E_NOT_FOUND } from "#exceptions/not-found";
import env from "#start/env";
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";
import { isDevSignInEnabled } from "./enabled.ts";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

/**
 * Dev only: the one-click sign-in link that run-dev-server's sign-in.sh
 * prints. Logs the browser in exactly as POST /auth/login does, then sends it
 * to the frontend.
 */
export default class DevSignInController {
  @inject()
  async handle({ auth, request, response }: HttpContext, service: Service) {
    // routes.ts registers this route only when enabled; check again so a
    // stray registration still answers 404.
    const enabled = isDevSignInEnabled({
      nodeEnvironment: app.nodeEnvironment,
      appEnvironment: app.getEnvironment(),
      flag: env.get("DEV_SIGN_IN_LINK_ENABLED"),
    });
    if (!enabled) throw new E_NOT_FOUND("Not found");

    const payload = await request.validateUsing(validator, {
      data: request.qs(),
    });

    const user = await service.execute(payload);
    if (!user) {
      return response.gone({
        message: "This sign-in link is used or expired. Run sign-in.sh again.",
      });
    }

    await auth.use("redis").login(user);

    return response.redirect(env.get("SITE_URL"));
  }
}
