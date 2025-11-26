import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { SignupService } from "./signup.service.js";
import { SignupValidator } from "./signup.validator.js";

export default class SignupController {
  @inject()
  async handle({ request, response }: HttpContext, service: SignupService) {
    const body = await request.validateUsing(SignupValidator);
    const user = await service.execute(body);

    return response.created(user);
  }
}
