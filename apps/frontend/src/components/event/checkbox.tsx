import type * as React from "react";

import { Checkbox as UiCheckbox } from "@/components/ui/checkbox";
import { cn } from "@/components/utils/cn";

type CheckboxProps = Omit<
  React.ComponentProps<typeof UiCheckbox>,
  "onChange" | "className"
> & {
  /** Accessible name, e.g. "Select Jane Doe" or "Select all". Shown beside the box unless `hideLabel`. */
  label: string;
  /** Keep the label for assistive tech only (table rows and the header box). */
  hideLabel?: boolean;
  /** Called with the next checked state. */
  onChange?: (checked: boolean) => void;
  className?: string;
};

// Overrides every components/ui/checkbox class the S2S look changes, so tailwind-merge drops the originals.
const box =
  "size-3.5 sm:size-3.5 cursor-pointer rounded-(--radius-4) border-line-check bg-transparent dark:not-data-checked:bg-transparent shadow-none before:hidden " +
  "focus-visible:ring-0 focus-visible:ring-offset-0 s2s-focus data-checked:border-fg data-indeterminate:border-fg data-disabled:cursor-not-allowed data-disabled:opacity-35 " +
  "[&_svg]:size-2.5 sm:[&_svg]:size-2.5";

/** The 14px checkbox tinted `fg` that selects table rows. */
function Checkbox({
  label,
  hideLabel = false,
  onChange,
  onCheckedChange,
  className,
  ...props
}: CheckboxProps) {
  const control = (
    <UiCheckbox
      aria-label={hideLabel ? label : undefined}
      className={cn(box, hideLabel && className)}
      onCheckedChange={(checked, details) => {
        onChange?.(checked);
        onCheckedChange?.(checked, details);
      }}
      {...props}
    />
  );

  if (hideLabel) return control;

  return (
    <label
      className={cn(
        "type-body text-fg inline-flex cursor-pointer items-center gap-(--space-8) has-data-disabled:cursor-not-allowed has-data-disabled:opacity-35",
        className,
      )}
    >
      {control}
      {label}
    </label>
  );
}

export { Checkbox };
export type { CheckboxProps };
