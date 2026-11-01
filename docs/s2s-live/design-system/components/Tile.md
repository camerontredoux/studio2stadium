# Tile

A dashboard widget that lives in three states: a square peek with one number, a 44px folded strip, and an open panel.

- **Peek**: always square (height equals column width). On phones, stacked full width, a peek is `tile-peek-m` (148px) tall. Label at the top, an expand icon at the right, and the content (usually a `Stat` plus one or two lines) pinned to the bottom. The whole tile is the button.
- **Strip**: when another tile is open, the rest fold into 44px strips with an icon, a mono count and a vertical label.
- **Open**: `tile-open` (640px) tall, or the window height under the header minus 72px when that is smaller (never under 400px), so opening never scrolls the page. The head becomes a 44px panel head with actions and a collapse button; the body scrolls. Use `ListRow` for 48px feed rows (icon, mono text, time, action).
- **Disabled**: dashed border on `bg-300`, no shadow, "Coming soon" in `fg-disabled`.
- Tiles sit in a grid with `space-8` gaps and animate between states over 500ms (`cubic-bezier(.2,.8,.2,1)`); only one is open at a time. Write every track list out in full (no `repeat()`), or the rows snap instead of animating.
- Four per row above 1180px; boards with a second row (check-in, results) go to 3 per row from 1180px down, filling both rows. Phones stack them.
- Consumer provides: `label`, `state`, `icon` (for strips), `count`, `onOpen` / `onCollapse`, `actions`, and the body.
