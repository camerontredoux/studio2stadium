// The list-picker look shared by the time picker and the combobox, so the two can't drift:
// a search field in a header, then one scrolling column of 28px rows, the chosen row filled.

/** The popup header that holds the search field. */
export const pickerHeaderClass = "border-line-soft border-b p-(--space-6)";

/** For components/ui's `Input` (its wrapper span): the 28px inset search field ("Type a time", "Search time zones"). */
export const pickerSearchClass =
  "rounded-(--radius-6) border-line-control bg-bg-300 dark:bg-bg-300 text-fg shadow-none before:hidden transition-[border-color] " +
  "has-focus-visible:border-line-focus has-focus-visible:ring-0 has-aria-invalid:border-danger has-focus-visible:has-aria-invalid:border-danger dark:has-aria-invalid:ring-0 " +
  "[&_input]:h-[26px] [&_input]:leading-[26px] [&_input]:px-[7px] [&_input]:s2s-input-size [&_input]:placeholder:font-sans [&_input]:placeholder:text-fg-3";

/** The scrolling column of rows: 6px padding, 2px between rows, about seven rows tall. */
export const pickerListClass =
  "relative flex max-h-[212px] w-full flex-col gap-(--space-2) overflow-y-auto overscroll-contain p-(--space-6) outline-none";

/**
 * One 28px row. Hover or keyboard highlight lifts it to `surface-active`; the chosen row is the
 * bright `fg` fill. Works for toggle items (`data-pressed`) and combobox items (`data-selected`).
 */
export const pickerRowClass =
  "flex h-7 w-full min-w-0 shrink-0 cursor-pointer items-center justify-between gap-(--space-8) rounded-(--radius-5) border-0 bg-transparent px-(--space-8) text-left font-normal text-fg-2 outline-none before:hidden " +
  "transition-[background-color,color] duration-150 ease-(--ease) motion-reduce:transition-none " +
  "hover:bg-surface-active hover:text-fg data-highlighted:bg-surface-active data-highlighted:text-fg data-[suggested=true]:bg-surface-active data-[suggested=true]:text-fg " +
  "pointer-coarse:after:min-h-auto pointer-coarse:after:min-w-auto focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-offset-[-2px] s2s-focus " +
  "data-pressed:bg-fg data-pressed:font-semibold data-pressed:text-on-fg data-pressed:hover:bg-fg data-pressed:hover:text-on-fg " +
  "data-selected:bg-fg data-selected:font-semibold data-selected:text-on-fg data-selected:data-highlighted:bg-fg data-selected:data-highlighted:text-on-fg data-selected:hover:bg-fg data-selected:hover:text-on-fg " +
  "disabled:cursor-default disabled:text-fg-disabled disabled:opacity-100 data-disabled:pointer-events-none data-disabled:text-fg-disabled";

/** A group heading inside the list ("Common US"): small, sentence case, `fg-3`. */
export const pickerGroupLabelClass =
  "type-caption-sm text-fg-3 px-(--space-8) pt-(--space-6) pb-(--space-2)";

/** The line shown when a search matches nothing. */
export const pickerEmptyClass =
  "type-caption text-fg-3 px-(--space-8) text-center not-empty:py-(--space-12)";
