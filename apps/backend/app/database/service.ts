import { E_DATABASE_ERROR } from "#exceptions/database";
import { RuntimeException } from "@adonisjs/core/exceptions";
import { DrizzleQueryError } from "drizzle-orm";
import postgres from "postgres";
import { db } from "./connection.ts";

type Client = typeof db;

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class DatabaseService {
  async use<T>(fn: (db: Client) => Promise<T>): Promise<T> {
    return await fn(db).catch((error) => {
      throw this.handleError(error);
    });
  }

  async tx<T>(fn: (db: Transaction) => Promise<T>): Promise<T> {
    return await db.transaction(fn).catch((error) => {
      throw this.handleError(error);
    });
  }

  private handleError(error: unknown) {
    if (
      error instanceof DrizzleQueryError &&
      error.cause instanceof postgres.PostgresError
    ) {
      const cause = error.cause;

      switch (cause.code) {
        case "23505":
          const field = cause.detail?.match(/^Key \((.+?)\)/)?.[1] || "field";

          throw new E_DATABASE_ERROR(`Unique ${field} already exists`, {
            code: "E_UNIQUE_VIOLATION",
            cause: field,
          });
        case "23503":
          throw new RuntimeException("Foreign key violation");
        case "23502":
          throw new E_DATABASE_ERROR(
            `Missing required field: ${cause.column_name}`,
            {
              code: "E_NOT_NULL_VIOLATION",
              cause: cause.column_name,
            }
          );
        case "42601":
          throw new E_DATABASE_ERROR("Database syntax error", {
            code: "E_PARSE_ERROR",
            cause: cause.detail,
          });
        default:
          throw new E_DATABASE_ERROR(`Database error: ${cause.code}`, {
            code: "E_DATABASE_ERROR",
            cause: cause.code,
          });
      }
    }
    throw error;
  }
}
