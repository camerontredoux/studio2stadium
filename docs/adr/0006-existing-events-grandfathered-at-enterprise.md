# Orgs that predate billing are grandfathered at Enterprise

Moving tier entitlement onto `org_events` has to account for orgs created by hand, whose access
comes from flag combinations on `organizations.features` that need not match any Event Tier we sell. Every
Org Event existing at migration time is stamped with the Enterprise Event Tier.

Deriving each org's nearest Event Tier would have kept the commercial door open, but these are our earliest
customers and hand-built accounts; a mapping bug would revoke access from someone mid-season. We took
the migration we cannot get wrong.

## Consequences

Pre-billing customers sit permanently at the top Event Tier and cannot be sold an upgrade. Their events
must be treated as a closed grandfathered set — moving them onto paid Event Tiers later is a commercial
conversation, not a migration.

## Who may create events in a grandfathered Org

A grandfathered Org's Organizers keep creating their own events, which take the Enterprise column
default. That default is only safe while every event in the Org is Enterprise. Once staff put any
event in the Org below Enterprise — at create, or by changing its Event Tier — the Org becomes
**tier-managed** (`organizations.tier_managed`). From then on its Organizers can no longer create
events, with the same 403 and message as in a self-serve Org (#112). Staff still create events
there, with an explicit Event Tier.

The flag is separate from `organizations.self_serve`, which means "an Event Tier purchase landed
here". Both are set once and never cleared, so deleting the event, or moving it back to Enterprise,
does not reopen free event creation. Orgs where every event is Enterprise stay grandfathered.
