# BottomBar

The phone navigation: a floating glass dock 12px from the screen edges, where the current page widens into a labelled pill.

- Background `glass` with a 16px blur, `line` border, `radius-16`, `shadow-dock`. Items are 20px icons in `fg-3`; the current one grows to 2.6× and shows its label on `line-soft`.
- Five items at most, the same destinations as the sidebar. Leave 84px of bottom padding on the page so content clears it.
- Consumer provides: `items` (`{label, icon, current, href}`).
