# Orgs that predate billing are grandfathered at Enterprise

Moving tier entitlement onto `org_events` has to account for orgs created by hand, whose access
comes from flag combinations on `organizations.features` that need not match any tier we sell. Every
Org Event existing at migration time is stamped Enterprise.

Deriving each org's nearest tier would have kept the commercial door open, but these are our earliest
customers and hand-built accounts; a mapping bug would revoke access from someone mid-season. We took
the migration we cannot get wrong.

## Consequences

Pre-billing customers sit permanently at the top tier and cannot be sold an upgrade. Their events
must be treated as a closed grandfathered set — moving them onto paid tiers later is a commercial
conversation, not a migration.
