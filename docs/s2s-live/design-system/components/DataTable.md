# DataTable

Rosters, rankings and logs: a CSS-grid table with 44px rows, a 32px `surface-head` header and `line-soft` dividers.

- Column labels are uppercase mono `label`; a `sortable` column shows a caret when sorted. Bibs and counts use `mono` or `num` (right-aligned, tabular); names `strong`; emails and schools `dim`; status words `status` coloured per row via `_colors` (`fg` for ACTIVE, `fg-3` for PENDING).
- Rows lighten to `surface-hover` on hover and `surface-chip` when selected. A `_total` row sits on `surface-head`.
- With `selectable`, a 16px checkbox column comes first. On phones drop the least useful column (email) rather than scroll.
- Rows are subgrids of one table grid, so a column can be `max-content` and still align. On phones the label column fits its content and the remaining columns split the rest evenly; drop columns in order of least use and turn labelled buttons into icon buttons at 480px.
- Column `width`s: leftover space goes to bars, long values and the action column (button right-aligned), never to a column of short labels, which gets a capped width such as `minmax(80px, 120px)`. Recheck the split at every breakpoint that changes the columns.
- Empty results use the `empty` text with a "Clear filters" action (`EmptyState`).
- Consumer provides: `columns` (`{key, label, kind, width, sortable}`), `rows`, optional `template`, `selectable`, `sort`, `onSort`, `onSelect`.
