# Menu

A popover list on `surface-raised` with `shadow-pop`, opened from a caret, chip or the profile button.

- An optional uppercase `label` heads it ("Events", "View as"). Items are 34px with a 14px icon; a radio item shows a check in a fixed slot; a `checkbox` item draws a filled square; `hint` adds a right-aligned mono note; `trailing` adds a control (a small "Make live" button).
- `danger` items ("Delete event") sit last, after a `separator` where there are other items.
- Position it yourself (absolute, 4px below its trigger); the component draws only the box.
- Consumer provides: `items`, `label`, and placement.
