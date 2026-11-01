# PillToggle

A 26px pill that a coach or dancer switches on and off in a row, such as "Call back" or a top-choice pick.

- Plain (no border at rest) for an action repeated on every row ("Call back"); `outline` for a choice the user must see as available (a dancer's top-choice slot, which shows its rank in mono once picked).
- Pressed fills with `fg` and `on-fg` text, the same treatment as a primary button.
- For a 28px icon-only toggle (favourite, note) use `IconToggle`: it rests at `fg-disabled` and turns `fg` when pressed or when it holds content (`has`).
- Consumer provides: `pressed`, `onChange(next)`, the label, and optional `icon`.
