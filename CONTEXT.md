# Studio 2 Stadium

The collegiate dance recruiting platform. This repo is the public marketing site and schools
directory; the product itself lives in the `app` repo. The glossary below is shared by both.

## Language

### Organisations and events

**Org**:
A tenant on the S2S Live platform — the party that hosts live recruiting events. Owns its own
branding, members, and events, and reaches them at `/o/{slug}`.
_Avoid_: Organisation, tenant, account, client, host

**Org Event**:
A single live, in-person recruiting occasion — an audition, tryout, showcase, or combine — owned by
one Org and sold individually. An Org may own many, but only one is active at a time.
_Avoid_: Event on its own, which is ambiguous — see Platform Event.

**Platform Event**:
A public, school-hosted or global event browsed in the main S2S app. A different concept from an Org
Event and a different set of tables; the two are never mixed.

**Tier**:
The bundle of features and limits bought for one Org Event — Core, Regional, National, or
Enterprise. What is sold and what is enforced are the same thing.
_Avoid_: Plan, package, subscription — nothing here recurs.

### People

**Dancer**:
A high-school-age person pursuing a place on a collegiate dance program. The persistent identity: a
Dancer stays a Dancer whether or not they are attending an Org Event.
_Avoid_: Athlete, talent, performer, participant

**Coach**:
A member of a college dance program's staff, verified by the Studio 2 Stadium team before being
granted access to Dancer profiles. Attends Org Events to evaluate Dancers.
_Avoid_: Recruiter, scout, evaluator

**Organizer**:
The person who runs an Org's events and buys S2S Live. Never appears on a Roster and never evaluates
Dancers — the distinction from a Coach is that an Organizer runs the event rather than recruiting at
it.
_Avoid_: Host, promoter, event manager

**Roster Entry**:
One person's participation in one Org Event. Roster Entries exist for both Dancers and Coaches, and
all event activity — notes, ratings, callbacks, school selections — is recorded against them rather
than against the person.
_Avoid_: Attendee, participant, registration

### Things

**Profile**:
A Dancer's portfolio on the platform. There is one Profile per Dancer; an Org Event surfaces that
same Profile rather than creating a second one.
_Avoid_: Event profile, performer profile, recruiting profile

**Claim**:
The act of a Roster Entry being connected to a real user account, turning a name on an uploaded
roster into a person with a Profile.
_Avoid_: Activation, merge, linking

**Reconciliation**:
The admin process of resolving Roster Entries against user accounts — resending, revoking, and
merging invites until every entry is either claimed or dismissed.

**Verification**:
The manual review by the Studio 2 Stadium team confirming a Coach's credentials, which unlocks
access to Dancer profiles.
_Avoid_: Approval, which refers to Schools appearing in the public directory — a different check.

**Premium Grant**:
Time-limited premium access given to a Dancer because of something they took part in, such as an Org
Event. Expires; not a purchase the Dancer made.
