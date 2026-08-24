# Buyers create an account before checkout

`org_memberships` requires a `userId`, and `add-org-member` hard-fails when no user matches the
given email. The pre-checkout form therefore ends in account creation, and the Checkout Session
carries a real `userId` in its metadata.

The alternative — creating the user from the Stripe billing email in the webhook — removes a step
before a $2,000 purchase, but the billing email on a corporate card is frequently not the buyer's
working address, which produces provisioned orgs that nobody can log into.

## Consequences

Provisioning never matches on email, so it cannot orphan an Org. The cost is a signup step in front
of the purchase, which will show up in conversion on the `/s2s-live` funnel.
