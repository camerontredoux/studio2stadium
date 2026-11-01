# PageHeader

The 56px bar at the top of the content column: title, live status, dates and the page's actions.

- The dashboard shows the event name with a `LiveBadge` and the dates in mono `fg-2` from 1000px down, when the rail (which carries them on wider screens) wraps below the widgets. Under 480px the dates hide. A sub-page shows a breadcrumb back to the event, a `line-focus` slash, then its own title.
- The title is `title` (15px, 600) and truncates; actions sit at the right.
- `status` goes on the title's line, right after the title. Never stack a crumb above a larger title and centre the badge beside both lines.
- Consumer provides: `title`, optional `crumb`, `status`, `dates`, `actions`.
