import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { inject } from "@adonisjs/core";
import hash from "@adonisjs/core/services/hash";
import { eq } from "drizzle-orm";
import { consumePasswordToken } from "../password-tokens.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(payload: Validator) {
    const user = await this.db.use((db) =>
      db.query.users.findFirst({
        where: {
          id: payload.userId,
        },
        columns: {
          password: true,
        },
      })
    );

    if (!user) throw new E_BAD_REQUEST("User not found");

    // A forgot-password token, or the set-password token an Organizer's
    // purchase emailed when it created their account (ADR 0007). Either is
    // spent here, so a link sets a password once.
    const consumed = await consumePasswordToken(payload.userId, payload.token);
    const { outcome } = consumed;
    if (outcome === "missing") {
      throw new E_BAD_REQUEST(
        "Could not find reset token. Please request a new one."
      );
    }
    if (outcome === "invalid") {
      throw new E_BAD_REQUEST("Invalid reset token");
    }

    const password = await hash.make(payload.password);

    // A set-password link only reaches the inbox of the account it was
    // created for, so using it proves the owner has that inbox. The same rule
    // as the other emailed-token flows: token consumption counts as email
    // verification. A forgot-password link verifies nothing new.
    const verifiesEmail =
      consumed.outcome === "consumed" && consumed.purpose === "setup";

    await this.db.use((db) =>
      db
        .update(users)
        .set(verifiesEmail ? { password, verified: true } : { password })
        .where(eq(users.id, payload.userId))
    );
  }
}
