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

    // const rateLimiter = limiter.use({
    //   requests: 1,
    //   duration: "1 min",
    //   blockDuration: "10 mins",
    //   inMemoryBlockDuration: "10 mins",
    //   inMemoryBlockOnConsumed: 11,
    // });

    // const executed = await rateLimiter.attempt(
    //   `login:${request.ip()}:${payload.email}`,
    //   () => service.execute(payload)
    // );

    // if (!executed) {
    //   const available = await rateLimiter.availableIn(
    //     `login:${request.ip()}:${payload.email}`
    //   );
    //   return response.status(429).json({
    //     message: `Too many requests. Please try again in ${available} seconds.`,
    //     available,
    //   });
    // }

    const user = await rateLimit(() => service.execute(payload), {
      key: `login:${request.ip()}:${payload.email}`,
      requests: 10,
      duration: "1 min",
      inMemoryBlockDuration: "10 mins",
      inMemoryBlockOnConsumed: 11,
    });

    await auth.use("redis").login(user);

    return response.json({
      id: user.id,
    });
  }
}
