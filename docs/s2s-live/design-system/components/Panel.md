# Panel

The bordered card every block of content sits in: `surface`, a `line` border, `radius-10` and `shadow-panel`.

- The head is 40px with an uppercase `label` (or a 13px/600 `title`), an optional mono `count`, then actions at the right. Inner content starts at `space-14`.
- Panels sit `space-8` apart; never nest a panel in a panel. For a sub-heading inside one, use a 36px `s2s-ph s2s-ph-sub` row on `surface-head`.
- `Toolbar` is the 48px strip under a head for filters and search; `Separator` is its 16px vertical rule.
- Consumer provides: `label` or `title`, optional `count`, `actions`, and the body.
