import { Kysely } from "kysely";
import { matchPgError } from "#database/errors";
import { DB } from "#database/generated/types";
import { db } from "#database/connection";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";

@inject()
export default abstract class BaseRepository {
  constructor(protected ctx: HttpContext) {}

  /**
   * Wraps a database operation with automatic error handling
   */
  protected async use<T>(fn: (db: Kysely<DB>) => Promise<T>) {
    try {
      return await fn(db);
    } catch (error) {
      throw matchPgError(error, this.ctx);
    }
  }
}
