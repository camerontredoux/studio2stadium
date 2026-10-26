# SplitButton

A joined pair or group of actions in one bordered control, used in the page header.

- One action plus a caret (`onMore`) when the main action has a menu of rarer ones: "Edit" with "Delete event" behind the caret.
- Two or more `actions` without a caret for a compact group of peers: "Upload" and "Add" on a roster, "Export" on the audit log. Inner dividers are `line-control`.
- On phones keep the icons and drop the labels (give each action an `ariaLabel`).
- Consumer provides: `actions` (`{label, icon, onClick, ariaLabel}`), and `onMore` / `moreOpen` when there is a menu.
