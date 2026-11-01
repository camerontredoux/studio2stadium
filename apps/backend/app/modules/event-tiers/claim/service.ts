import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { E_FORBIDDEN } from "#exceptions/forbidden";
import env from "#start/env";
import { inject } from "@adonisjs/core";
import { completePendingClaims } from "./complete.ts";
import { checkClaimToken, spendClaimToken } from "./tokens.ts";
import { type Validator } from "./validator.ts";

export interface ClaimResult {
  /** Every Org the user has claimed, each with its admin URL. */
  orgs: Array<{ name: string; slug: string; url: string }>;
}

/**
 * Claim the Org(s) a purchase bought for an account nobody had proved they own
 * (ADR 0007). Two proofs are needed together: the signed-in user is the
 * account the purchase landed on, and they hold the link emailed to that
 * account's inbox. Either alone is not enough — whoever registered the address
 * can sign in to it, and a forwarded link can be opened by anyone.
 *
 * The token is checked, the claim completed in one transaction, and only then
 * is the token spent. Completing is idempotent, so a double submit claims once
 * and a failed transaction leaves the link usable.
 */
@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(
    signedInUserId: string,
    payload: Validator
  ): Promise<ClaimResult> {
    if (payload.userId !== signedInUserId) {
      throw new E_FORBIDDEN(
        "This link is for a different account. Sign in with the account it was emailed to."
      );
    }

    const check = await checkClaimToken(signedInUserId, payload.token);
    if (check === "missing") {
      throw new E_BAD_REQUEST(
        "This claim link has expired or was already used."
      );
    }
    if (check === "invalid") {
      throw new E_BAD_REQUEST("Invalid claim link");
    }

    const orgs = await this.db.tx((tx) =>
      completePendingClaims(tx, signedInUserId)
    );

    await spendClaimToken(signedInUserId, payload.token);

    return {
      orgs: orgs.map((org) => ({
        name: org.name,
        slug: org.slug,
        url: `${env.get("SITE_URL")}/o/${org.slug}/admin`,
      })),
    };
  }
}
