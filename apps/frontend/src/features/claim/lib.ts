/**
 * Whether the signed-in user can claim with this link. The link names the
 * account it was emailed to; signed in as any other account, the claim would
 * be refused, so the page says so up front instead of offering the button.
 */
export function claimAccess(
  session: { id: string },
  linkUserId: string,
): "ready" | "wrong_account" {
  return session.id === linkUserId ? "ready" : "wrong_account";
}

/** Where to send a user once they have claimed: the first Org's admin area. */
export function claimedDestination(
  orgs: Array<{ slug: string }>,
): { to: "/o/$orgSlug/admin"; params: { orgSlug: string } } | null {
  const [first] = orgs;
  return first
    ? { to: "/o/$orgSlug/admin", params: { orgSlug: first.slug } }
    : null;
}
