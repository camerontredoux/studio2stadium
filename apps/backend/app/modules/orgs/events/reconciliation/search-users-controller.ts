import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ReconciliationService } from "./service.ts";
import { searchSchema } from "../rosters/attach/search-validator.ts";

export default class SearchSchoolUsersController {
  @inject()
  async handle(
    { request, response }: HttpContext,
    service: ReconciliationService
  ) {
    const { q } = await request.validateUsing(searchSchema);
    const results = await service.searchSchoolUsers(q ?? "");
    return response.ok(results);
  }
}
