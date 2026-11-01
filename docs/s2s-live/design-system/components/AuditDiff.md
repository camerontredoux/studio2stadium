# AuditDiff

The before-and-after table shown when an audit log row is expanded.

- Mono throughout: the field in `fg-2`, the old value struck through in `fg-3`, an arrow in `fg-disabled`, the new value in `fg`. An empty side shows a dash in `fg-disabled`.
- Above it, a meta line in mono `fg-3` gives the exact time and the record id.
- Consumer provides: `rows` (`{field, before, after}`) and `meta`.
