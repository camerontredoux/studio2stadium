# A refunded Org Event is deactivated, not revoked

Provisioning is automatic, so the reverse case needs an answer. By the time a refund or chargeback
arrives, the Org may have uploaded a roster of real dancers and coaches may have recorded notes,
ratings, and callbacks against them. A refund therefore sets the Org Event inactive and notifies the
Studio 2 Stadium team; it does not delete the event, its roster, or any Premium Grants already given
to dancers.

Automatic teardown was rejected because a chargeback landing mid-event would break a live audition,
and dancers would lose granted premium over a dispute they are not party to.

## Consequences

This is deliberately not full automation: a refund during a live event needs a human. Resolution
happens in Stripe and the admin dashboard, as a conversation with the customer.

The same reasoning blocks deletion of a purchased Org Event: the delete endpoint returns 409 for
everyone, S2S staff included, and points to deactivation instead. There is no staff override yet, so
an event provisioned by mistake can only be deactivated. Deleting a whole Org still cascades through
its events to their `event_tier_purchases` rows, so the sale record is lost on that path; Stripe
remains the record of the payment. If staff need to remove such events, add a staff-only override,
or change the foreign key so purchase rows survive the Org being deleted.
