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
