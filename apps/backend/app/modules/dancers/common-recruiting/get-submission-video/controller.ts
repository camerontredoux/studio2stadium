import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetSubmissionVideoController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const submission = await service.execute(ctx.session.profileId);

    return ctx.response.ok({ youtubeId: submission?.youtubeId });
  }
}
