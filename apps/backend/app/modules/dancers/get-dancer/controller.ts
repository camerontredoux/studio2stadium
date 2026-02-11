import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { E_UNAUTHORIZED_ACCESS } from "#exceptions/unauthorized";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class GetDancerController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const { params } = await ctx.request.validateUsing(validator);
    const session = ctx.auth.getUserOrFail();

    if (session.username !== params.username && session.type !== "school") {
      if (session.role !== "admin") {
        throw new E_UNAUTHORIZED_ACCESS(
          "You are not authorized to view this profile"
        );
      }
    }

    const user = await service.execute(params.username);

    if (!user) {
      throw new E_BAD_REQUEST("Dancer not found", {
        username: params.username,
      });
    }

    return ctx.response.ok(user);
  }
}
