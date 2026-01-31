import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { E_UNAUTHORIZED_ACCESS } from "#exceptions/unauthorized";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { getUserByUsername } from "./queries.ts";
import { getProfileSchema } from "./schema.ts";

export default class GetProfileController {
  @inject()
  async handle({ auth, request, response }: HttpContext) {
    const { params } = await request.validateUsing(getProfileSchema);
    const session = auth.getUserOrFail();

    if (session.username !== params.username && session.type !== "school") {
      if (session.role !== "admin") {
        throw new E_UNAUTHORIZED_ACCESS(
          "You are not authorized to view this profile"
        );
      }
    }

    const user = await getUserByUsername(params.username);

    if (!user) {
      throw new E_BAD_REQUEST("Dancer not found", {
        username: params.username,
      });
    }

    return response.ok(user);
  }
}
