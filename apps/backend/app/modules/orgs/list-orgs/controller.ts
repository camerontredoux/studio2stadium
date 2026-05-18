import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListOrgsService } from "./service.ts";

export default class ListOrgsController {
  @inject()
  async handle({ response }: HttpContext, service: ListOrgsService) {
    const orgs = await service.execute();
    return response.ok(orgs);
  }
}
