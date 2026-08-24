# Tier entitlement lives on the Org Event

Feature flags are org-level today: `organizations.features` is untyped `jsonb`, read through
`useOrg()` and enforced in route `beforeLoad` guards. Because a Tier is bought per Org Event, we put
the purchased Tier on `org_events` and resolve entitlement from the active event, leaving
`organizations.features` for genuine org-wide configuration such as branding and free-tier settings.

Keeping entitlement org-level was cheaper — no migration, no guard rewrite — but an Org buying Core
for its spring showcase and National for its summer combine would silently get National features at
both. Whatever we sell and whatever we enforce have to be the same thing, or we can never sell the
same upgrade twice.

## Consequences

The route guards that currently read `features.callbacks`, `features.check_in`,
`features.school_selections`, and `features.video_library` from `useOrg()` must move to the active
Org Event. Every Org Event existing at migration time is grandfathered at Enterprise so that no
current customer loses access.
