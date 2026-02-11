import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetSchoolProfileController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const session = ctx.auth.getUserOrFail();

    const data = await service.execute(session.id);

    if (!data) {
      throw new E_BAD_REQUEST("School not found", {
        id: session.id,
      });
    }

    return ctx.response.ok(data);
  }
}
