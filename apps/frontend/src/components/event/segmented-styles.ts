// Classes for `Segmented` and `MenuSegmented` (the same control inside a menu).

/** The track: bg-300 with a line border and 2px inset. Shared with `MenuSegmented`. */
export const segmentedGroupClass =
  "bg-bg-300 border-line inline-flex flex-none gap-(--space-2) rounded-(--radius-7) border p-(--space-2)";

/** One segment; the chosen one is `surface-pressed`. Shared with `MenuSegmented`. */
export const segmentedItemClass =
  "h-(--control-sm) sm:h-(--control-sm) min-w-0 sm:min-w-0 gap-(--space-6) rounded-(--radius-5) border-0 bg-transparent px-(--space-8) text-fg-2 text-[12.5px] sm:text-[12.5px] font-normal shadow-none before:hidden " +
  "hover:bg-transparent dark:hover:bg-transparent hover:text-fg data-pressed:bg-surface-pressed dark:data-pressed:bg-surface-pressed data-pressed:text-fg " +
  "focus-visible:ring-0 focus-visible:ring-offset-0 s2s-focus disabled:opacity-35 bp-phone:gap-[5px] bp-phone:px-[7px]";
