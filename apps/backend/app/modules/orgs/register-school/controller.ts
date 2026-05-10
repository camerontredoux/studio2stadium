import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { RegisterSchoolService, InviteInvalidError } from "./service.ts";
import { schema } from "./validator.ts";

export default class RegisterSchoolController {
  @inject()
  async handle(
    { request, response }: HttpContext,
    service: RegisterSchoolService
  ) {
    const payload = await request.validateUsing(schema);
    try {
      const result = await service.execute(payload);
      return response.created(result);
    } catch (err) {
      if (err instanceof InviteInvalidError) {
        return response.gone({ message: err.message });
      }
      throw err;
    }
  }
}
