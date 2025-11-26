import DatabaseException from "#exceptions/database.exception";
import { HttpContext } from "@adonisjs/core/http";
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

        throw new DatabaseException(`Unique ${field} already exists`, {
          code: "E_UNIQUE_VIOLATION",
          cause: field,
        });
      case "23503":
        ctx.logger.error({ err: error }, "Foreign key violation");
        throw new RuntimeException();
      case "23502":
        throw new DatabaseException(`Missing required field: ${error.column}`, {
          code: "E_NOT_NULL_VIOLATION",
          cause: error.column,
        });
    }
  }
  throw error;
}
