import { premiumGrants } from "#database/schema/organizations";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";
import { DatabaseService } from "#database/service";

export default class DevGrantController {
  @inject()
  async handle(ctx: HttpContext, db: DatabaseService) {
    if (app.inProduction) {
      return ctx.response.notFound();
    }

    const user = ctx.auth.getUserOrFail();

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await db.use((conn) =>
      conn.insert(premiumGrants).values({
        userId: user.id,
        sourceType: "org_event",
        expiresAt,
      })
    );

    return ctx.response.ok({ granted: true, expiresAt });
  }
}
