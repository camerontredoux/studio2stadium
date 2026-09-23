import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { inject } from "@adonisjs/core";
import hash from "@adonisjs/core/services/hash";
import { eq } from "drizzle-orm";
import { invalidateUserSessions } from "#auth/invalidate";
import { completePendingClaims } from "#modules/event-tiers/claim/complete";
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

    // A set-password link was created with the account, for an Organizer
    // whose purchase made it (ADR 0007), and marks it verified — the same rule
    // as the other emailed-token flows. A forgot-password link leaves
    // `verified` alone: that flag means an onboarded dancer or an accepted
    // school, and resetting a password is neither.
    const setsUp =
      consumed.outcome === "consumed" && consumed.purpose === "setup";

    const claimed = await this.db.tx(async (tx) => {
      await tx
        .update(users)
        .set(setsUp ? { password, verified: true } : { password })
        .where(eq(users.id, payload.userId));

      // Either link only reaches the account's inbox, so using it proves the
      // user reads that inbox. That is what an Org bought for this account is
      // waiting for, so any such claim completes here too: a buyer who lost
      // the claim email finishes by resetting their password.
      return await completePendingClaims(tx, payload.userId);
    });

    // The session carries the user's Org memberships; refresh any that are
    // open so a claimed Org shows up.
    if (claimed.length > 0) await invalidateUserSessions(payload.userId);
  }
}
