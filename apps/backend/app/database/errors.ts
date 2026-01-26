import { E_DATABASE_ERROR } from "#exceptions/database";
import { type HttpContext } from "@adonisjs/core/http";
import { RuntimeException } from "@poppinss/utils";
import { DatabaseError } from "pg";

export function matchPgError(error: unknown, ctx: HttpContext) {
  if (error instanceof DatabaseError) {
    switch (error.code) {
      case "23505":
        const field =
          error.constraint
            ?.replace(/_unique$|_key$/, "")
            .split("_")
            .pop() || "information";

        throw new E_DATABASE_ERROR(`Unique ${field} already exists`, {
          code: "E_UNIQUE_VIOLATION",
          cause: field,
        });
      case "23503":
        ctx.logger.error({ err: error }, "Foreign key violation");
        throw new RuntimeException("Foreign key violation");
      case "23502":
        throw new E_DATABASE_ERROR(`Missing required field: ${error.column}`, {
          code: "E_NOT_NULL_VIOLATION",
          cause: error.column,
        });
      case "42601":
        ctx.logger.error({ err: error }, "Database syntax error");
        throw new E_DATABASE_ERROR("Database syntax error", {
          code: "E_PARSE_ERROR",
          cause: error.detail,
        });
      default:
        throw new E_DATABASE_ERROR(`Database error: ${error.code}`, {
          code: "E_DATABASE_ERROR",
          cause: error.code,
        });
    }
  }
  throw error;
}
