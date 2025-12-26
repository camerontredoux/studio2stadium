import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Kysely } from "kysely";
import { db } from "../database/connection.ts";
import { matchPgError } from "../database/errors.ts";
import { DB } from "../database/generated/types.ts";

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
    return db.transaction().execute(async (trx) => {
      try {
        return await fn(trx);
      } catch (error) {
        throw matchPgError(error, this.ctx);
      }
    });
  }
}
