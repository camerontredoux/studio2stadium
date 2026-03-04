import { rateLimit } from "#utils/rate-limit";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class LoginController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const { auth, request, response } = ctx;
    const payload = await request.validateUsing(validator);

    const user = await rateLimit(() => service.execute(payload), {
      key: `login:${request.ip()}:${payload.email}`,
      requests: 10,
      duration: "1 min",
      inMemoryBlockDuration: "10 mins",
      inMemoryBlockOnConsumed: 11,
    });

    const guard = auth.use("redis");
    await guard.login(user);

    const isMobile = request.header("X-Client-Type") === "mobile";
    if (isMobile) {
      return response.ok({
        token: guard.getSessionToken(),
        expiresIn: 604800, // 7 days in seconds
        user,
      });
    }

    return response.noContent();
  }
}
