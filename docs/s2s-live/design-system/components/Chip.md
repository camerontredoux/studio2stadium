# Chip

A 24px token for one small fact you may click: a dancer in a callback, a date, a time.

- `sub` puts a mono prefix in `fg-3` before the label ("122 Jane Doe").
- `mono` for bibs and times. Pass `onClick` for a chip that opens a picker (it shows `active` when its picker is open) or `href` for a chip that links.
- Wrap chips with `space-6` gaps. A row of chips on a phone scrolls sideways instead of wrapping.
- Consumer provides: the label, optional `sub`, and `onClick` or `href`.
