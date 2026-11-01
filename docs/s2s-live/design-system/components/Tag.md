# Tag

A bordered, uppercase mono word that states a status: LIVE, FINALS, CLOSED.

- `tone="live"` colours the word with `accent`; `danger` for a blocking state; `muted` for a past or inactive one. The border stays `line-control` in every tone, so the word carries the colour and the meaning.
- `LiveBadge` is the header's version: a 24px badge with LIVE in `accent` followed by the day ("Day 2/3") in `fg`. Use it exactly as is wherever it appears: 24px tall, `0 8px` padding, `radius-5`, 11.5px mono, an 8px gap and the "Day 2/3" format. Don't shrink it, grey out the day or reword it.
- Never put a sentence in a tag; one or two words.
- Consumer provides: the word (in sentence case; the style uppercases it) and a `tone`.
