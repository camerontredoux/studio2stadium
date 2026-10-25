# ProgressBar

A 6px track (`track`) with a `fill-bar` fill and a mono percentage, for activation and check-in progress.

- Put the percentage at the right in `fg-2`; in a totals row make it `strong` (`fg`).
- The fill is never the accent colour: progress is neutral, only "live" is coloured.
- Consumer provides: `value` (0–100), optional `label` for the accessible name, `showValue`, `strong`.
