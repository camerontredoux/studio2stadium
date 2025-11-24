import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { RegisterService } from "./register.service.js";
import { RegisterValidator } from "./register.validator.js";

export default class RegisterController {
  @inject()
  async handle({ auth, request, response }: HttpContext, service: RegisterService) {
    const body = await request.validateUsing(RegisterValidator);
    const user = await service.execute(body);
    await auth.use("web").login(user);
    return response.ok({
      message: "User created",
    });
  }
}
