import env from "#start/env";
import { sendOrgReadyEmail } from "../provisioning/event.ts";
import { mintClaimToken } from "./tokens.ts";

export interface ClaimEmailInput {
  buyer: { id: string; firstName: string; email: string };
  org: { name: string; slug: string };
  event: { name: string };
}

/** Where a claim link lands: the product's claim page. */
export function claimUrl(userId: string, token: string) {
  const url = new URL("/claim", env.get("SITE_URL"));
  url.searchParams.set("token", token);
  url.searchParams.set("userId", userId);
  return url.toString();
}

/**
 * Mint a fresh claim token for the buyer and send them the "claim your Org"
 * variant of the Org-ready email (ADR 0007). The fresh token replaces any
 * earlier one, so the newest email is the one that works.
 *
 * Returns whether the email went. A failed send is logged and reported by
 * `sendOrgReadyEmail` and does not throw; failing to mint the token does.
 */
export async function emailClaimLink({
  buyer,
  org,
  event,
}: ClaimEmailInput): Promise<boolean> {
  const token = await mintClaimToken(buyer.id);

  return await sendOrgReadyEmail(
    {
      to: buyer.email,
      firstName: buyer.firstName,
      orgName: org.name,
      orgUrl: `${env.get("SITE_URL")}/o/${org.slug}/admin`,
      eventName: event.name,
      setPasswordUrl: null,
      claimUrl: claimUrl(buyer.id, token),
    },
    { orgSlug: org.slug }
  );
}
