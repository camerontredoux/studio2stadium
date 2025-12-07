import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { SignupService } from "./signup.service.js";
import { signupValidator } from "./signup.validator.js";
import { rateLimit } from "#shared/rate-limit";

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
