import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { RegisterService } from "./register.service.js";
import { RegisterValidator } from "./register.validator.js";

export default class RegisterController {
  @inject()
  async handle({ request, response }: HttpContext, service: RegisterService) {
    const body = await request.validateUsing(RegisterValidator);
    await service.execute(body);

    return response.ok({
      message: "User created successfully.",
    });
  }
}
