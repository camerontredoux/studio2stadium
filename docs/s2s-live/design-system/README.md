# S2S Live design system

S2S Live is the operations console for a dance event: the admin runs check-in, rosters, callbacks and the schedule from it, while coaches and dancers see their own slice. It is a dark, dense working surface built for a laptop at a front desk and a phone in a hallway. Every screen should feel calm, exact and quick to scan, with grey doing almost all of the work and one small accent saying "this is live".

## Content fundamentals

- **Sentence case everywhere** a person reads a phrase: "Upload CSV", "Make live", "Scan next", "Resend invite", "No schedule yet". Never Title Case on buttons.
- **UPPERCASE only for mono labels**: section and column labels (`label` style: "CALLBACKS", "TIMESTAMP"), status words ("LIVE", "ACTIVE", "PENDING"). Write them in sentence case in code and let the style uppercase them.
- **Verb first, two words at most** on a button: "Check in", "Match", "Replace", "New callback". A destructive action names the thing: "Delete event", "Remove".
- **Numbers carry the meaning; words frame them.** "3 to match", "2/5 checked in", "Day 2 of 3", "40%". Set the number in mono (`data`, `bib-lg`) or the display style, and the frame words in `fg-3`.
- **Join metadata with a middle dot** ( · ): "Finals · 35m ago", "2 mo ago · 3 rows", "Checked in · 09:48".
- **Relative time, short units**: "35m ago", "2 mo ago". Clock times are 24-hour ("09:48"). The full timestamp goes in a `title` tooltip.
- **Empty and blocked states say what is true, plainly**: "No dancers called back yet", "Everyone is checked in", "Not on the roster", "Coming soon". No apologies, no exclamation marks.
- **Missing data is a bracketed placeholder**, never invented copy: "[Venue name]", "[Street address, City, State]".
- **No emoji.** Status is a word, a colour from the signal set and, where it helps, an icon.

## Visual foundations

### Color

- The ground is `bg-100` under a faint dot grid (`dot-grid`, 1px dots at a 14px pitch). Content sits in panels and tiles on `surface` with a `line` border and `shadow-panel`.
- Depth is a ladder of near-blacks, lightest on top: `bg-000` (live camera) → `bg-100` (page) → `bg-300` (inset fields) → `surface` (panels) → `surface-head` (table heads, dialogs) → `surface-hover` → `surface-raised` (buttons, menus) → `surface-chip` → `surface-active` (current nav) → `surface-pressed`. Step up one rung for hover, two for pressed. Never skip to a mid grey.
- Text uses three greys: `fg` for content and anything the user acted on, `fg-2` for secondary values (emails, schools, summaries, resting nav), `fg-3` for labels, metadata and resting icons. `fg-disabled` is only for inactive things.
- `fg` doubles as the one bright fill. A primary button, a pressed pill and the dock's current item are `fg` with `on-fg` text, so the strongest action is white, not coloured.
- `accent` (`live` by default; an event may choose `amber`, `sky` or plain `fg`) is spent in tiny amounts: the LIVE word, a connected status icon and today's share of the day strip. Never on buttons, borders or large fills.
- `danger` marks destructive actions and the offline icon, always with a word. `count` is only the roster size beside a nav item.
- Dividers: `line-soft` between rows, `line` around panels and under heads, `line-control` around controls.

### Type

- Two families from Google Fonts: **Geist** (`sans`) for words and **Geist Mono** (`mono`) for anything you might compare or copy: bibs, counts, times, file names, emails, status words and labels. Mono always uses tabular figures.
- The UI runs small and tight: `body` is 13px/1.4, controls are 12.5px (`control`), the page title is only 15px (`title`). Weight does the ranking: 400 for values, 500 for names and controls, 600 for titles and big numbers.
- Big numbers are the only display type: `display-stat` (32px, 600, -0.03em) on a peek tile, `display-day` for "Day 2", and the mono bibs `bib-lg` / `bib-hero` on scan results and passes. Use one per tile.
- `label` (11px mono, uppercase, .06em) heads every panel, tile and column. It is the system's signature; do not replace it with bold sans headings.

### Spacing and layout

- One gutter, `space-8`, between the sidebar, panels, tiles and the rail. Inside a panel the left edge is `space-14`; a head is `panel-head` (40px) or, on tiles, `row` (44px) tall.
- Rows are `row` (44px) with `row-head` (32px) header rows on `surface-head`. Columns are CSS grid with `space-12` column gaps; numbers align right.
- **Tables share one set of columns.** Rows are subgrids of the table (`grid-template-columns: subgrid`), so a column can size to its widest cell (`max-content`) and still line up across rows.
- **On phones, columns split evenly.** Fixed column widths suit desktop; on a phone they waste space. Below 800px the label column fits its content and the remaining columns, the action column included, split the rest evenly, so their right edges are equally spaced. Drop columns in order of least use (the activation bar first, then Active at 480px, which Total minus Pending gives anyway), and switch labelled buttons to square icon buttons at the same step.
- **Spare width goes to the columns that use it.** In a table, the columns that grow are the ones that can show more with more room: a progress bar, a long value like an email, or the action column (its button right-aligned, so it never sits against the last number). A column of short labels ("Dancers", "Coaches", "All") gets a capped width such as `minmax(80px, 120px)` and never takes `1fr` of the leftover space. Check this at every breakpoint where columns change, phones included.
- The app frame: a `sidebar` (232px, collapsing to `sidebar-collapsed`) on the left, a `header` (56px) on top, the working column, and a `rail` (300px) of event details. It steps down in this order as the screen narrows, and every view (admin, coach, dancer) uses the same steps:

  | Screen width | What changes |
  | --- | --- |
  | above `bp-sidebar` (1360px) | Sidebar open, rail beside the widgets, 4 widgets per row |
  | ≤ `bp-sidebar` (1360px) | Sidebar collapses to its icon strip on its own (only when the screen enters this range; a person can reopen it, and it reopens itself above 1360px only if it closed itself) |
  | ≤ `bp-board` (1180px) | Widget boards with a second row go to 3 columns |
  | ≤ `bp-rail` (1000px) | Rail wraps below the widgets; the `LiveBadge` and dates move into the header |
  | ≤ `bp-phone` (800px) | Phone: the sidebar becomes the floating dock, widgets stack, tables drop columns instead of scrolling |
  | ≤ `bp-small` (480px) | Header dates hide; tables drop their next column and icon-only buttons replace labelled ones |

- **One set of breakpoints, shared.** The steps above live in one shared layout stylesheet that every view links; a view never redefines the shell, the board or a breakpoint in its own styles. A rule that must beat a view's own rule wins by specificity, never by load order, because the shared file loads first.
- **Stacked rows take their full height.** When the rail wraps below the widgets, its row is sized to its content (`grid-auto-rows: max-content`), never left to stretch or shrink with the window: a panel that clips its overflow would otherwise collapse to its border.
- **Widgets are square.** A peek tile's height always equals its column width, at every screen size; never cap the height while the column keeps growing. On phones, where widgets stack full width, every peek is `tile-peek-m` (148px) tall, enough for the longest preview without clipping.
- **An open widget is `tile-open` (640px) tall**, shrinking to the window under the header (window height − 72px, at least 400px) on shorter screens so opening one never scrolls the page; its body scrolls instead. On phones it stays 640px.
- **Animated track lists are written out.** Widget rows and columns animate between states, and a browser cannot animate between `repeat(5, 148px)` and five separate values, so every board track list is written out in full.
- Control heights come in three sizes: `control-sm` (24px) inside tile heads, `control` (28px) by default, `control-lg` (32px) in dialogs and the scanner.
- **Status sits on the line it describes.** A badge or tag (`LiveBadge`, `Tag`) goes inline on the same text line as the name it qualifies. Never place one as a separate item vertically centred beside a two-line heading block, because it ends up floating between the lines and wraps unpredictably on a phone.
- **Header items share one line.** Align everything in a header to the title's line. Use `align-items: center` only when every item is one line tall; otherwise align to the baseline or the bottom edge. Check every new header at 1440px and 390px wide before it ships.
- **Check layouts in every state, at every step.** Before a layout change ships, look at it at 390, 800, 1000, 1180 and 1440px wide, with each widget closed and open.

### Shape, borders and elevation

- Radii scale with the object: `radius-4` tags, `radius-5` chips and small buttons, `radius-6` buttons and inputs, `radius-10` panels and menus, `radius-12` dialogs and the viewfinder. Pills (`radius-pill`) are only for the 26px toggle pills.
- Every surface has a 1px border. Shadows are dark and soft: `shadow-panel` on panels, `shadow-pop` on menus, `shadow-dialog` on dialogs, `shadow-dock` on the dock. A disabled tile has a dashed border, `bg-300` fill and no shadow.
- No gradients except the single hard-stop fill that shows today's progress inside a day segment, and no coloured left borders.

### States and motion

- Hover lightens the fill one rung (or the border to `line-hover`) and brightens text to `fg` or `fg-strong`. Pressed or selected uses `surface-pressed` or the `fg` fill.
- Keyboard focus is a solid 2px `fg` outline with a 2px offset (the check-in scanner built from this mockup uses exactly this); inputs also lift their border to `line-focus`.
- Disabled is `opacity: .35` on a control, or `fg-disabled` text with `cursor: not-allowed`.
- Motion is short and functional: 150ms for hover colours, 200–300ms ease for fades, and a 500ms `cubic-bezier(.2,.8,.2,1)` when dashboard tiles expand and fold. The scan line sweeps at 1.4s; under `prefers-reduced-motion` it stops at the centre.

### Imagery

- There is no photography or illustration. The only pictures are the user's own (video thumbnails, a schedule PDF on `fill-bar` paper with `shadow-paper`) and a QR code drawn in `on-fg` modules on an `fg` card.
- A thumbnail without media is a `surface-chip` box with a centred icon in `line-focus`.

## Iconography

- Icons are **Phosphor, regular weight**, drawn inline as SVG on a 256 viewBox with `fill="currentColor"`, so they take the text colour. Use the Phosphor icon package by name; never copy SVG paths from the mockup.
- Two sizes: `icon` (16px) in nav items and tile strips, `icon-sm` (14px) inside buttons, chips, menus and rows. A large state icon (scan result, idle viewfinder) is 32px.
- Icons sit at `fg-3` at rest and `fg` when their row is current or hovered. An icon-only button always has an `aria-label`.
- No emoji, no coloured icons except a status icon in `accent` or `danger`.

## Using this system in the app

- Tokens: `tokens.json` is the source of truth; `tokens.css` lists every token as a CSS variable with its usage note. Map them into the app's scoped `.theme-s2s` theme (see the handoff addendum).
- Reach for a token before a literal: `var(--surface)`, `var(--space-14)`, `var(--radius-10)`.
- **Reuse, never restyle.** When a page shows something the dashboard already has (the `LiveBadge`, a button, a panel head, a label), use that component or copy its exact size, padding, colours and wording. A one-off variant, such as a smaller LIVE badge or "Day 2 of 3" where the badge says "Day 2/3", is a bug, even on a standalone page.
