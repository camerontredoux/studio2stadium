import { HttpContext } from "@adonisjs/core/http";
import { LoginService } from "./login.service.js";
import { loginValidator } from "./login.validator.js";
import { inject } from "@adonisjs/core";
import { rateLimit } from "#shared/rate-limit";

export default class LoginController {
  @inject()
  async handle({ auth, request, response }: HttpContext, service: LoginService) {
    const payload = await request.validateUsing(loginValidator);

    const user = await rateLimit(() => service.execute(payload), {
      key: `login:${request.ip()}:${payload.email}`,
      requests: 5,
      duration: "1 min",
      blockDuration: "5 mins",
    });

    await auth.use("web").login(user);

    return response.json({
      id: user.id,
    });
  }
}
