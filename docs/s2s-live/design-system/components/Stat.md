# Stat

The one big number on a peek tile, with an optional "/total" and a short caption.

- 32px, 600, -0.03em, line-height 1. The total is mono 14px `fg-3`; the caption is 12.5px `fg-3` ("to match", "checked in").
- One stat per tile; anything more belongs in the open tile.
- Consumer provides: `value`, optional `of`, `caption`.
