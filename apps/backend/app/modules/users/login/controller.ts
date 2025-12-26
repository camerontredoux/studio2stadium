import { sessionCache } from "#utils/cookie-cache";
import { multiRateLimit } from "#utils/rate-limit";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { LoginService } from "./service.ts";
import { loginValidator } from "./validator.ts";

export default class LoginController {
  @inject()
  async handle(ctx: HttpContext, service: LoginService) {
    const { auth, request, response } = ctx;
    const payload = await request.validateUsing(loginValidator);

    const user = await multiRateLimit(
      () => service.execute(payload),
      [
        {
          key: `login:${request.ip()}`,
          requests: 10,
          duration: "1 min",
        },
        {
          key: `login:${request.ip()}:${payload.email}`,
          requests: 10,
          duration: "1 min",
          blockDuration: "10 mins",
        },
      ]
    );

    await auth.use("redis").login(user);
    await sessionCache.initializeCache(ctx, user);

    return response.json({
      id: user.id,
    });
  }
}
