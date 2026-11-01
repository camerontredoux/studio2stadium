# Segmented

A filter of two to four mutually exclusive views, each with a mono count.

- Sits at the left of a table toolbar: "All 5", "Active 2", "Pending 3". The pressed segment fills with `surface-pressed`.
- Counts are mono `fg-3`, which stays above 4.5:1 on the pressed segment too.
- On phones, give each option an `icon` and hide the label text.
- Consumer provides: `options` (`{value, label, count, icon}`), `value`, `onChange`, and a group `label`.
