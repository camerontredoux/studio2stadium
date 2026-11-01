# DayProgress

The event's place in time: a LIVE tag, "Day 2 of 3" and one segment per day, with today filled in `accent` up to the current hour.

- Past days are `fill-done`, upcoming days `track-upcoming`; today's label turns `fg`. The time left sits at the top right in mono `fg-2`.
- It heads the right rail and is the only place a hard-stop gradient is allowed.
- Consumer provides: `day`, `days`, `pct` (today's progress), `labels` (one per day, e.g. "Thu 23"), `left`.
