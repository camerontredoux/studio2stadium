import { db } from "#database/connection";
import { matchPgError } from "#database/errors";
import { DB } from "#database/generated/types";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Kysely } from "kysely";

@inject()
export default abstract class BaseQuery {
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

  /**
   * Helper to run multiple operations in a transaction
   */
  protected async transaction<T>(fn: (trx: Kysely<DB>) => Promise<T>) {
    return db
      .transaction()
      .execute(fn)
      .catch((e) => {
        throw matchPgError(e, this.ctx);
      });
  }
}
