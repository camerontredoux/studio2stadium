# Rating

A coach's five-step score, drawn as small bars rather than stars.

- `Rating` is the editable one in a table row: 14×8 segments, `fg` when filled, `line-control` when empty, with the number in mono after it. Hovering previews the score in `fg-2`. Clicking the current score clears it.
- `RatingMeter` is the read-only version (8×5, or 16×6 with `large`) for peeks and summaries.
- Consumer provides: `value`, `onChange`, and a `label` naming who is rated.
