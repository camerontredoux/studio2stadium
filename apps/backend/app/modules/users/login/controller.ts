import { rateLimit } from "#utils/rate-limit";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { LoginService } from "./service.ts";
import { loginValidator } from "./validator.ts";

export default class LoginController {
  @inject()
  async handle(ctx: HttpContext, service: LoginService) {
    const { auth, request, response } = ctx;
    const payload = await request.validateUsing(loginValidator);

    const user = await rateLimit(() => service.execute(payload), {
      key: `login:${request.ip()}:${payload.email}`,
      requests: 10,
      duration: "1 min",
      inMemoryBlockDuration: "10 mins",
      inMemoryBlockOnConsumed: 11,
    });

    await auth.use("redis").login(user);

    return response.noContent();
  }
}
