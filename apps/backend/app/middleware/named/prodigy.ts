import { db } from "#database/connection";
import ForbiddenException from "#exceptions/forbidden";
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import { sql } from "kysely";

/**
 * Prodigy middleware is used to deny access to non-Prodigy accounts.
 */
@inject()
export default class ProdigyMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail();

    const isProdigy = await db
      .selectFrom("dancer_accounts as da")
      .innerJoin("dancer_platforms as dp", "dp.account_id", "da.id")
      .innerJoin("platforms as p", "p.id", "dp.platform_id")
      .where("p.name", "=", "prodigy")
      .where("da.user_id", "=", user.id)
      .select(sql<number>`1`.as("exists"))
      .limit(1)
      .executeTakeFirst();

    if (!isProdigy) {
      throw new ForbiddenException("This endpoint is only accessible to Prodigy accounts.");
    }
    return next();
  }
}
