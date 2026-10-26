# DetailList

Stacked term and value pairs for an event's details in the right rail.

- Terms are 11.5px `fg-3` ("Dates · 2026", "Times · MDT"); values are 13px `fg`, with an optional `sub` line in `fg-2`.
- A `range` renders two chips joined by an arrow; each chip opens its date or time picker.
- Consumer provides: `items` (`{label, value, sub}` or `{label, range: [start, end], mono, onStart, onEnd}`).
