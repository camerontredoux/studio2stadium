import { HttpContext } from "@adonisjs/core/http";
import { LoginService } from "./login.service.ts";
import { loginValidator } from "./login.validator.ts";
import { inject } from "@adonisjs/core";
import { multiRateLimit } from "#shared/rate-limit";

export default class LoginController {
  @inject()
  async handle({ auth, request, response }: HttpContext, service: LoginService) {
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

    await auth.use("web").login(user);

    return response.json({
      id: user.id,
    });
  }
}
