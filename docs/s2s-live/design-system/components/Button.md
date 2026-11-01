# Button

The everyday action: a 28px grey button with a 14px icon and a sentence-case verb.

- **Variants.** `default` (on `surface-raised` with a `line-control` border) for most actions; `ghost` for quiet actions in a toolbar or tile head ("Close camera", collapse); `primary` (an `fg` fill with `on-fg` text) at most once per view, for the action the view exists for ("Open camera", "Switch email"); `danger` is a ghost button in `danger` for "Remove".
- **Sizes.** `sm` (24px, `radius-5`) inside tile and panel heads; `md` (28px) by default; `lg` (32px) in dialogs and the scanner.
- **Icon-only** (`iconOnly`) is square and must get a `label`, which becomes its `aria-label`.
- Pass `href` to render a link that looks like a button. Disabled buttons fade to .35 opacity.
- Consumer provides: `children` (the label), optional `icon` (an `Icon` name), `onClick`.
