import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class ShowInterestController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);
    const result = await service.execute(payload, ctx.session.profileId);

    if (result.created) {
      return ctx.response.created(result);
    }

    throw new E_BAD_REQUEST(
      "You can only show interest in a school three times",
      {
        schoolId: payload.params.id,
      }
    );
  }
}
