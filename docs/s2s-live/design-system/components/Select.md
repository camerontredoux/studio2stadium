# Select

A native select dressed as a 28px control with a caret, for choosing one row from a list.

- Use `size="lg"` (32px) inside a dialog. Group long lists with `{group, options}` (for example "Not activated" and "Active").
- Pair it with `Field` for an uppercase mono label above.
- Consumer provides: `options`, `value` or `defaultValue`, `onChange`, and a `label` when there is no visible one.
