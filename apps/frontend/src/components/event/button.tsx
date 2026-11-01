import type * as React from "react";

import { Button as UiButton } from "@/components/ui/button";
import { cn } from "@/components/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = Omit<
  React.ComponentProps<typeof UiButton>,
  "variant" | "size"
> & {
  /** `secondary` (default) for most actions; `primary` at most once per view. */
  variant?: ButtonVariant;
  /** 24px (tile and panel heads), 28px (default) or 32px (dialogs, scanner). */
  size?: ButtonSize;
  /** Square button holding only an icon. Give it a `label`. */
  iconOnly?: boolean;
  /** Accessible name; required in practice for `iconOnly` buttons. */
  label?: string;
};

// Every class components/ui/button sets that the S2S look changes is overridden here,
// including its `sm:` variants, so tailwind-merge drops the originals.
const base =
  "gap-(--space-6) border font-medium leading-[1.4] whitespace-nowrap transition-[background-color,border-color,color] duration-150 " +
  "[&_svg]:mx-0 [&_svg:not([class*='opacity-'])]:opacity-100 [&_svg:not([class*='size-'])]:size-3.5 sm:[&_svg:not([class*='size-'])]:size-3.5 " +
  "focus-visible:ring-0 focus-visible:ring-offset-0 s2s-focus disabled:opacity-35 shadow-none";

const variants: Record<ButtonVariant, string> = {
  secondary:
    "border-line-control bg-surface-raised text-fg hover:bg-surface-raised-hover hover:text-fg-strong data-pressed:bg-surface-raised-hover data-popup-open:bg-surface-raised-hover data-popup-open:text-fg-strong",
  ghost:
    "border-transparent bg-transparent text-fg-2 hover:bg-surface-active hover:text-fg data-pressed:bg-surface-active data-popup-open:bg-surface-active data-popup-open:text-fg",
  primary:
    "border-fg bg-fg text-on-fg hover:border-fg-strong hover:bg-fg-strong hover:text-on-fg data-pressed:bg-fg-strong data-popup-open:bg-fg-strong",
  danger:
    "border-transparent bg-transparent text-danger hover:bg-surface-active hover:text-danger data-pressed:bg-surface-active data-popup-open:bg-surface-active",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-(--control-sm) sm:h-(--control-sm) rounded-(--radius-5) before:rounded-[4px] px-(--space-8) text-[12px] sm:text-[12px]",
  md: "h-(--control) sm:h-(--control) rounded-(--radius-6) before:rounded-[5px] px-(--space-10) text-[12.5px] sm:text-[12.5px]",
  lg: "h-(--control-lg) sm:h-(--control-lg) rounded-(--radius-6) before:rounded-[5px] px-(--space-12) text-[12.5px] sm:text-[12.5px]",
};

const iconOnlySizes: Record<ButtonSize, string> = {
  sm: "w-(--control-sm) px-0",
  md: "w-(--control) px-0",
  lg: "w-(--control-lg) px-0",
};

/**
 * The S2S button. Wraps components/ui/button (so `render` works for links) and
 * restyles it. Pass a 14px Phosphor icon as a child, before the label.
 */
function Button({
  variant = "secondary",
  size = "md",
  iconOnly = false,
  label,
  className,
  ...props
}: ButtonProps) {
  return (
    <UiButton
      aria-label={label}
      variant="ghost"
      size="default"
      className={cn(
        base,
        variants[variant],
        sizes[size],
        iconOnly && iconOnlySizes[size],
        className,
      )}
      {...props}
    />
  );
}

export { Button };
export type { ButtonProps, ButtonSize, ButtonVariant };
