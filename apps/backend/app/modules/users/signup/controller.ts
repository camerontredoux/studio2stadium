import { rateLimit } from "#utils/rate-limit";
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { SignupService } from "./service.ts";
import { signupValidator } from "./validator.ts";

export default class SignupController {
  @inject()
  async handle({ request, response }: HttpContext, service: SignupService) {
    const payload = await request.validateUsing(signupValidator);

    const user = await rateLimit(() => service.execute(payload), {
      key: `signup:${request.ip()}:${payload.email}`,
      requests: 5,
      duration: "1 min",
      blockDuration: "5 mins",
    });

    return response.created(user);
  }
}
