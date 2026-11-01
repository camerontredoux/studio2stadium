# S2S Live: design reference for the event dashboard

Reference material for building the S2S Live dashboard (admin, coach and dancer views)
inside this app. Nothing in this folder is imported by the app. Read `handoff-addendum.md`
first; it says how to build, what to port and what not to touch.

## What's here

| Path | What it is | Read it for |
| --- | --- | --- |
| `handoff-addendum.md` | The build instructions | Start here |
| `design-system/README.md` | Brand rules: colour, type, spacing, layout, breakpoints, motion | Every decision |
| `design-system/tokens.json` | Every token with its value and usage (source of truth) | Exact values |
| `design-system/tokens.css` | The same tokens as CSS variables, with usage comments | Variable names for `.theme-s2s` |
| `design-system/components/*.md` | One guide per component: look, states, rules | The component you're building |
| `mockup/shared/shell.css` | The mockup's shared layout: shell, board, dock, all breakpoints | Layout and motion values |
| `mockup/Main.dc.html` | Admin dashboard mockup | Admin widgets and roster table |
| `mockup/Coach.dc.html` | Coach view mockup | Coach widgets and roster |
| `mockup/Dancer.dc.html` | Dancer view mockup | Dancer widgets and check-in pass |
| `mockup/checkin-desk.html` | Full-page check-in desk (admin) | The scanner page |

## How to read the mockup

- The `.dc.html` files are design-canvas pages, not app code. Their markup and styles are the
  spec; their scripts are demo plumbing with sample data. Don't port the scripts.
- Skip the inline SVG path data. Icons are Phosphor (regular weight); use the icon package by
  name.
- Open a view file only for the widget you're building. `shared/shell.css` and the design
  system README cover everything shared.
- The component guides' "Consumer provides" lines describe the mockup's reference components,
  not an API this app has to match.

## Known gaps

- `checkin-desk.html` shows times as "9:48 AM"; the design system says 24-hour ("09:48").
  Follow the design system.
- Two colours used in the mockup have no token: the chip border (#2E2E2E) and the date-range
  middle fill (#272727). Use the hex values, or add tokens for them and say so.
