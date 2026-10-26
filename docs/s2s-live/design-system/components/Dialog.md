# Dialog

A modal for one short decision, centred on a `scrim`, at most 420px wide.

- `surface-head` body, `line-control` border, `radius-12`, `shadow-dialog`. Title in `title`; the body stacks fields `space-14` apart; the footer sits on `surface` with a `line` rule.
- Footer actions are 32px: a ghost "Cancel" then one primary verb ("Switch email"), disabled until the choice is valid.
- `Readout` shows a fixed value (an icon, a mono value, a mono note) inside the body.
- Consumer provides: `title`, the body, `footer`; use `inline` only to show it in place, as here.
