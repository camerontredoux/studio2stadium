# Studio 2 Stadium

The collegiate dance recruiting platform. This repo is the product: the web app, its API, and the
notifications worker. The public marketing site and schools directory live in a separate repo. The
glossary below is shared by both.

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

**Event Tier**:
The bundle of features and limits bought for one Org Event — Core, Regional, National, or
Enterprise. What is sold and what is enforced are the same thing.
_Avoid_: Plan, package, subscription — nothing here recurs. Never bare "tier", which is ambiguous
with Account Tier.

**Account Tier**:
The level of platform access a Dancer's account holds — standard or limited. An Org Event grants one
for a window the Org configures, after which it lapses unless the Dancer subscribes.
_Avoid_: Bare "tier"; premium, which is the Dancer's own paid subscription rather than a grant.

### Programs and people

**School**:
A college dance program represented on the platform. A School has a public Program profile and may recruit Dancers through the platform.
_Avoid_: College, team, organisation, which can refer to other concepts.

**Program**:
A School's dance program as presented to Dancers for discovery and recruiting. It is not an Org or an Org Event.
_Avoid_: School when referring to the program's public recruiting presence.

**Follow**:
A Dancer's saved connection to a Program. A Dancer follows a Program to find it again and receive updates from it. The product also calls this action Favorite; use Follow for the Dancer-to-Program action.
_Avoid_: Favorite for this action.

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

**Interest**:
A Dancer's expression of interest in a School's Program. It is separate from following the Program and from submitting an application.
_Avoid_: Follow, Favorite, application

**Application**:
A Dancer's submission to a School through the platform. The School can review and update its status.
_Avoid_: Interest, submission when the recruiting context is important

**Subscription**:
A Dancer's paid, recurring access to premium platform features. It is separate from an Account Tier granted by an Org Event.
_Avoid_: Event Tier, Premium Grant

**Feed**:
A stream of updates from the Programs or Dancers a user follows.
_Avoid_: Notification list, activity list

**Video**:
Media in a Dancer's or School's profile or library that can be viewed as recruiting content.
_Avoid_: Profile, image

**Profile View**:
A recorded occasion when a School views a Dancer's Profile.
_Avoid_: Interest, Follow

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
The record of an Account Tier being given to a Dancer because of something they took part in, such
as an Org Event. Expires; not a purchase the Dancer made.
