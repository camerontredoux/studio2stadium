# Organizer is a distinct org member type

`org_member_type` is `["coach", "dancer"]`, and the same enum is used for both org memberships and
event roster entries. The person who buys S2S Live runs the event: they never appear on a roster and
never evaluate dancers. We add `organizer` to the enum rather than filing them as a coach with
`role = "admin"`.

Reusing `coach` needed no migration, but organizers would then appear wherever coaches are listed,
and `coach` would stop meaning "college dance program staff" — a term both products and the public
site depend on.

## Consequences

Every switch on `org_member_type` needs auditing, including roster code that reasonably assumes an
entry is a coach or a dancer. Organizer memberships must never produce a Roster Entry.
