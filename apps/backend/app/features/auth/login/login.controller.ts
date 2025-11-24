import { HttpContext } from "@adonisjs/core/http";
import { LoginService } from "./login.service.js";
import { LoginValidator } from "./login.validator.js";
import { inject } from "@adonisjs/core";

export default class LoginController {
  @inject()
  async handle({ auth, request }: HttpContext, service: LoginService) {
    const body = await request.validateUsing(LoginValidator);
    const user = await service.execute(body);

    await auth.use("web").login(user);

    return { id: user.id };
  }
}
