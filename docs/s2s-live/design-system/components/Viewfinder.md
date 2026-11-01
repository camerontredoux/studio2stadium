# Viewfinder

The square QR scanner used at check-in, in four states: idle, live, a hit and a miss.

- Idle: `bg-100` with `line-focus` corners, a 32px QR icon and the primary "Open camera" button. Live: `bg-000`, `fg` corners, a sweeping scan line and an uppercase mono state ("Scanning").
- A hit lays a blurred `veil` over the camera with a check, the bib in `bib-lg`, the name and "Checked in · 09:48". A miss uses an x in `danger` and "Not on the roster".
- Below it, offer "Scan next" and a ghost "Close camera". The sweep stops under reduced motion.
- In the admin dashboard's Check-in widget the viewfinder stands alone, with a "Last checked in" card under it (bib, name, time) and a "Full page" link in the widget head to the full check-in desk; the roster list lives only on that page. On phones both shrink to 180px wide so they fit the open widget.
- Consumer provides: `state`, `bib`, `name`, `meta`, `stateLabel`, and the idle `action`.
