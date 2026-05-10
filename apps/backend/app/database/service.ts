import { E_DATABASE_ERROR } from "#exceptions/database";
import { RuntimeException } from "@adonisjs/core/exceptions";
import logger from "@adonisjs/core/services/logger";
import { DrizzleQueryError } from "drizzle-orm";
import postgres from "postgres";
import { db } from "./connection.ts";
import { AuditCollector, type AuditContext } from "./audit.ts";

type Client = typeof db;

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

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

  async withAudit<T>(
    ctx: AuditContext,
    fn: (tx: Transaction, audit: AuditCollector) => Promise<T>
  ): Promise<T> {
    return await db
      .transaction(async (tx) => {
        const audit = new AuditCollector();
        const result = await fn(tx, audit);
        await audit.flush(tx, ctx);
        return result;
      })
      .catch((error) => {
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
        case "23503": {
          const detail = (cause as { detail?: string }).detail ?? "";
          const constraint =
            (cause as { constraint?: string }).constraint ?? "unknown";
          console.error("FK violation", { constraint, detail });
          throw new E_DATABASE_ERROR(
            `Foreign key violation on ${constraint}: ${detail}`,
            { code: "E_FK_VIOLATION", cause: constraint }
          );
        }
        case "23502":
          throw new E_DATABASE_ERROR(
            `Missing required field: ${cause.column_name}`,
            {
              code: "E_NOT_NULL_VIOLATION",
              cause: cause.column_name,
            }
          );
        case "23514":
          throw new E_DATABASE_ERROR("Check constraint violation", {
            code: "E_CHECK_CONSTRAINT_VIOLATION",
            cause: cause.detail,
          });
        case "42601":
          throw new E_DATABASE_ERROR("Database syntax error", {
            code: "E_PARSE_ERROR",
            cause: cause.detail,
          });
        default:
          this.#logUnmappedPostgresError(error, cause);
          throw new E_DATABASE_ERROR(`Database error: ${cause.code}`, {
            code: "E_DATABASE_ERROR",
            cause: cause.code,
          });
      }
    }
    throw error;
  }

  /**
   * Logs full Postgres + Drizzle context for errors we don't map to a specific
   * exception (e.g. 42P01 undefined_table). Safe to ship: goes to server logs only.
   */
  #logUnmappedPostgresError(
    drizzleError: DrizzleQueryError,
    cause: postgres.PostgresError
  ) {
    logger.error(
      {
        pgCode: cause.code,
        pgMessage: cause.message,
        detail: cause.detail,
        hint: cause.hint,
        schema: cause.schema_name,
        table: cause.table_name,
        column: cause.column_name,
        constraint: cause.constraint_name,
        position: cause.position,
        where: cause.where,
        query: drizzleError.query,
        params: drizzleError.params,
      },
      "Unmapped Postgres error from Drizzle query"
    );
  }
}
