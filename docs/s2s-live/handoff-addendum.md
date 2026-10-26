## Addendum: building the S2S Live dashboard inside the existing app

### What you're given (all under `docs/s2s-live/`)
- `design-system/`: `README.md` (rules), `tokens.json` (values, source of truth), `tokens.css`
  (the same tokens as CSS variables), `components/*.md` (one guide per component).
- `mockup/`: `shared/shell.css` (layout, breakpoints, shared styles) and one file per view:
  `Main.dc.html` (admin), `Coach.dc.html`, `Dancer.dc.html`, plus `checkin-desk.html`
  (the full-page check-in desk).
- Read `mockup/shared/shell.css` and the design system README for styles and layout. Open a
  view's `.dc.html` only for the widget you're building, and skip its SVG path data and scripts.

### Hard constraints
- Do NOT modify anything in `components/ui/*` or the global `index.css`. They belong to the
  other part of the site and must look exactly the same after this work.
- Do NOT create a second global stylesheet that redefines `:root` / `@theme` variables.
  Route-level CSS imports stay loaded after client-side navigation and would leak into the
  rest of the site.
- Before starting, confirm the Tailwind version (v3 config vs v4 `@theme`) and the router,
  and tell me what you found.

### Theming: one Tailwind setup, theme scoped to a class
1. Create `styles/theme-s2s.css`, imported once from the same entry as `index.css`. Define every
   S2S token under `.theme-s2s { ... }`, the same way a `.dark` block overrides `:root`:
   - Map S2S tokens onto the variables `components/ui` already reads (`--background`,
     `--foreground`, `--popover`, `--primary`, `--muted`, `--accent`, `--border`, `--input`,
     `--ring`, `--radius`, …).
   - Add S2S-only variables (`--surface`, `--surface-head`, `--surface-raised`, `--surface-chip`,
     `--surface-pressed`, `--fg-2`, `--fg-3`, `--line`, `--line-soft`, `--line-control`,
     `--line-focus`, `--live`, …) and expose them to Tailwind (v4: `@theme inline`;
     v3: `theme.extend`) so `bg-surface-raised`, `text-fg-3` etc. exist. Only use them inside
     the dashboard.
   - Values come from `design-system/tokens.json`; `tokens.css` lists the variable names.
2. The dashboard root layout gets `className="theme-s2s"` plus Geist / Geist Mono. Nothing
   outside the dashboard routes gets this class.
3. Base UI portals (Popover, Menu, Select, Dialog, Tooltip, …) render outside the layout root.
   While a dashboard route is mounted, add `theme-s2s` to `<body>` (an effect in the dashboard
   layout that adds the class on mount and removes it on unmount), or pass a themed `container`
   to every `*.Portal`. Pick one and use it everywhere.

### The mockup is a spec, not code to port
The mockup was built without a component library, so it hand-rolls machinery that
`components/ui` (Base UI) already provides. Port the DESIGN and the MOTION. Rebuild the
BEHAVIOR on our components.

- Use `components/ui` for anything it already does: popover open/close and positioning,
  outside-click and Escape handling, focus management, keyboard navigation, calendar date math,
  menus, selects, dialogs, tooltips. Restyle it; don't reimplement it.
- Do NOT port: the mockup's hand-built calendar grid and date math, absolutely positioned
  popovers, document click handlers, inline style strings, its template/state plumbing, its
  sample data, or its simulated "demo scan" camera fallback.
- Icons are Phosphor (regular weight). Use the icon package by name (e.g.
  `@phosphor-icons/react`); never copy SVG path data from the mockup.
- DO port exactly: tokens, sizes, spacing, typography, layout rules and every animation in
  the motion spec below.
- S2S components live in `components/event/*`. Each one wraps a `components/ui` primitive and
  restyles it via `className`/`cn()` or the primitive's class/slot props. Only add a variant
  to a `components/ui` file if a wrapper truly can't do the job; it must be purely additive
  (new `cva` key, no default changed, no existing classes touched). List any such edit
  in your summary.
- The app shell (sidebar, header, body grid, right rail, widget board, phone dock) is built
  once in `components/event/shell/*` and used by all three views (admin, coach, dancer).
  No view redefines layout or breakpoints on its own.

### Motion spec (port exactly; these took real tuning)
Ease used throughout: `cubic-bezier(.2,.8,.2,1)`.
1. Widget board open/fold: `grid-template-columns`, `grid-template-rows` and `height` (two-row
   boards also `margin-right` and `row-gap`) transition over 500ms with the ease above.
   Apply the transition only for 600ms after an open/close, so window resizes and
   breakpoint changes don't animate.
2. Widget layer crossfade: each widget stacks three layers (peek, folded strip, open). The
   outgoing layer fades out over 150ms ease and turns `visibility: hidden` at 150ms; the
   incoming layer fades in over 300ms ease after a 250ms delay.
3. Scroll in step with opening: when a widget opens, the scroll container scrolls so the board
   top sits 8px below the scroll top (phones: plus 52px × the opened widget's index). Run it
   over the same 500ms with ease-out-quart (`1 - (1 - p)^4`) on `requestAnimationFrame`, so
   the scroll and the grid change read as one motion.
4. Grid track lists that animate must be written out in full (no `repeat()`), or the browser
   snaps instead of animating.
5. Widget hover: border-color 200ms; expand-icon button background/color 150ms; open widget
   head background 150ms.
6. Schedule widget preview: the page behind is `filter: blur(4px) contrast(.65) brightness(.17)`,
   easing to `blur(3px) … brightness(.22)` on hover over 300ms.
7. Sidebar collapse: `flex-basis` 232px ↔ 56px over 150ms ease.
8. Phone dock (floating, 12px from the screen edges): the current item's `flex-grow` goes
   1 → 2.6 over 350ms (ease above), with background-color/color over 200ms. Its label reveals
   with `grid-template-columns` 0fr → 1fr, `margin-left` 0 → 8px and opacity 0 → 1, all 350ms.
9. Check-in scanner: scan line sweeps top ↔ bottom, 1.4s ease-in-out, infinite alternate;
   corner brackets change border-color over 200ms; the camera feed fades in over 300ms; the
   scan result overlay enters over 250ms ease from opacity 0 and `scale(.98)`.
10. Small ones: accordion chevrons rotate 180° over 150ms, audit-row chevrons 90° over 150ms;
    rating segments change background over 100ms.
11. Popovers and menus have no motion in the mockup. Keep `components/ui`'s default; don't
    invent new motion. Under `prefers-reduced-motion`, the scan line stops at the centre and
    the board, dock and sidebar motion become instant.

### Worked example: `components/event/date-range-picker.tsx`
Built on our existing date picker / calendar and Base UI Popover in `components/ui`; only
the look and the start→end flow come from the mockup.
- Trigger: two chips side by side with an arrow icon between ("Thu, Oct 22 → Sat, Oct 24"),
  each `flex: 1` with centred text. Chips are 24px tall, `radius-5`, `surface-chip`, with a
  1px #2E2E2E border (no token for this). The chip whose picker is open gets a `line-focus`
  border on `surface-pressed`.
- Popup: full width of the field, 6px below it; 8px padding, `surface-raised`, 1px
  `line-control` border, `radius-10`, `shadow-pop`.
- Header: 24px ghost icon buttons for previous/next month; month label 12.5px weight 500.
- Grid: 7 columns, 2px gap. Weekday row: mono 10.5px `fg-3`, 20px tall.
  Days: 28px tall, `radius-5`, 12px tabular numbers.
  - Start and end day: `fg` fill, `on-fg` text, weight 600.
  - Days between them: #272727 fill (no token), `fg` text.
  - Other days: transparent, `fg-2`.
  - Days outside the month: hidden.
- Flow: picking a start date moves straight to picking the end date; picking the end closes
  the popup. The time range picker works the same way (start → end) with 30-minute slots from
  06:00 to 22:00, 24-hour.
- Style it through the calendar's own class/slot props (caption, nav buttons, weekday, day,
  selected / range start / range end / range middle, outside). Don't rebuild its grid or
  date logic.

### Layout rules (from the mockup)
- Breakpoints:
  - ≤1360: the sidebar collapses on its own, only when the screen enters that range; a manual
    toggle wins.
  - ≤1180: boards with a second row go to 3 columns.
  - ≤1000: the rail wraps below the widgets, and the LIVE badge and dates move into the header.
  - ≤800: phone layout (floating dock, stacked widgets).
  - ≤480: header dates hide, tables drop the Active column, and Upload goes icon-only.
- Widgets are always square on desktop; phone peeks are 148px tall; an open widget is
  `min(640px, 100vh - 72px)`, never under 400px.
- When the rail stacks below the widgets, the body grid uses `grid-auto-rows: max-content`, or
  the rail collapses to its border.
- Tables: rows are subgrids of one table grid. On phones the label column is `max-content` and
  the other columns, the action column included, split the rest evenly.
- Full rules are in `design-system/README.md`; follow it over this summary where they differ.

### Done means
- Every page outside the dashboard looks identical before and after. Screenshot a few key
  pages before you start and compare after.
- Navigate dashboard → main site → dashboard without a full reload. No S2S colours or fonts
  remain on the main site, including inside popups.
- Every animation above runs, checked by eye and with reduced motion on.
- The dashboard checked at 390, 800, 1000, 1180 and 1440px wide, with widgets closed and open.
