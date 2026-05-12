// apps/backend/app/modules/orgs/events/rosters/attach/search-controller.ts
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { AttachAccountService } from "./service.ts";
import { searchSchema } from "./search-validator.ts";

export default class SearchDancerUsersController {
  @inject()
  async handle({ request, response }: HttpContext, service: AttachAccountService) {
    const { q } = await request.validateUsing(searchSchema);
    const results = await service.searchDancerUsers(q ?? "");
    return response.ok(results);
  }
}
