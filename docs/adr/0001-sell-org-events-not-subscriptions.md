# S2S Live sells Org Events, not Org subscriptions

S2S Live is priced per event (Core $2,000, Regional $3,000, National $4,200, Enterprise custom), but
the entity a purchase must create is an Org, which owns many events. We sell one Org Event per
checkout: the first purchase also creates the Org and makes the buyer its admin, and later purchases
add further Org Events to the Org that already exists.

We rejected an Org-level subscription. It would have reused the dancer subscription machinery almost
unchanged, but it contradicts every price on the marketing page and does not match how an event
organizer budgets — they approve spend per event, not per year.

## Consequences

Nothing about an Org recurs, so an Org with no purchased events is a real and valid state. Anything
that needs to know whether a customer is "paying" must ask about an Org Event, never about the Org.
