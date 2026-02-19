import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetSkillsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const skills = await service.execute();

    return ctx.response.ok(skills);
  }
}
