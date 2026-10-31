# Sidebar

The left rail: workspace switcher, nav items with counts, section labels, and the signed-in person at the foot.

- 232px wide (`sidebar`), collapsing to 56px (`sidebar-collapsed`) where only icons remain and section labels become 1px rules.
- It collapses on its own when the screen enters the 801–1360px range, so the widgets beside the rail keep their size. A person can reopen it; it reopens on its own above 1360px only if it closed itself.
- Nav items are 32px, `fg-2` at rest, `fg` on `surface-active` when current. Roster counts sit at the right in `count`.
- Sections ("Rosters", "Admin") are `fg-3` 12px labels with a caret.
- The foot shows an `Avatar` (initials on `line`), name and email, and opens the "View as" menu.
- Under 800px replace it with `BottomBar`.
- Consumer provides: `org` (`{mark, name}`), `items` (`{label, icon, count, current, href}` or `{section}`), `user`, `collapsed`, `onToggle`.
