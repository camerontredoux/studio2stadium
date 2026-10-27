import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type * as React from "react";

import { Icon } from "@/components/event/icon";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/components/utils/cn";

type ToggleBaseProps = Omit<
  React.ComponentProps<typeof Toggle>,
  | "pressed"
  | "defaultPressed"
  | "onPressedChange"
  | "onChange"
  | "variant"
  | "size"
>;

type PillToggleVariant = "plain" | "outline";

type PillToggleProps = ToggleBaseProps & {
  pressed: boolean;
  /** Called with the next pressed state. */
  onChange: (next: boolean) => void;
  /** `plain` (default) for an action repeated on every row; `outline` for a choice that must read as available. */
  variant?: PillToggleVariant;
  /** Optional 14px icon before the label. */
  icon?: PhosphorIcon;
};

// Overrides every components/ui/toggle class the S2S look changes, so tailwind-merge drops the originals.
const pillBase =
  "h-[26px] sm:h-[26px] min-w-0 sm:min-w-0 gap-(--space-6) rounded-(--radius-pill) border px-(--space-10) text-fg-2 text-[12.5px] sm:text-[12.5px] font-medium shadow-none before:hidden justify-self-start " +
  "bg-transparent hover:bg-transparent dark:hover:bg-transparent not-data-pressed:hover:text-fg " +
  "data-pressed:border-fg data-pressed:bg-fg data-pressed:text-on-fg dark:data-pressed:bg-fg data-pressed:hover:bg-fg dark:data-pressed:hover:bg-fg " +
  "focus-visible:ring-0 focus-visible:ring-offset-0 s2s-focus disabled:opacity-35";

const pillVariants: Record<PillToggleVariant, string> = {
  plain: "border-transparent not-data-pressed:hover:border-line-control",
  outline:
    "min-w-16 sm:min-w-16 border-line-control not-data-pressed:hover:border-line-focus data-pressed:font-mono data-pressed:text-[12px] sm:data-pressed:text-[12px] data-pressed:tabular-nums",
};

/** A 26px pill toggled on and off in a row ("Call back", a top-choice pick). Pressed fills with `fg`. */
function PillToggle({
  pressed,
  onChange,
  variant = "plain",
  icon,
  className,
  children,
  ...props
}: PillToggleProps) {
  return (
    <Toggle
      pressed={pressed}
      onPressedChange={(next) => onChange(next)}
      className={cn(pillBase, pillVariants[variant], className)}
      {...props}
    >
      {icon ? <Icon icon={icon} className="size-3.5 opacity-100" /> : null}
      {children}
    </Toggle>
  );
}

type IconToggleProps = ToggleBaseProps & {
  pressed: boolean;
  /** Called with the next pressed state. */
  onChange: (next: boolean) => void;
  /** Accessible name ("Favourite Jane Doe"). */
  label: string;
  icon: PhosphorIcon;
  /** Icon shown while pressed (e.g. a filled heart); defaults to `icon`. */
  pressedIcon?: PhosphorIcon;
  /** The control holds content (e.g. a saved note): shown in `fg` even when not pressed. */
  has?: boolean;
  /** `md` (default) a 28px box with a 14px icon; `lg` a 40px tap area with a 22px icon, for touch. */
  size?: "md" | "lg";
};

/** A 28px icon-only toggle (favourite, note). Rests at `fg-disabled`; `fg` when pressed or holding content. */
function IconToggle({
  pressed,
  onChange,
  label,
  icon,
  pressedIcon,
  has = false,
  size = "md",
  className,
  ...props
}: IconToggleProps) {
  return (
    <Toggle
      aria-label={label}
      pressed={pressed}
      onPressedChange={(next) => onChange(next)}
      data-has={has || undefined}
      className={cn(
        "text-fg-disabled size-(--control) min-w-0 rounded-(--radius-6) border-0 bg-transparent p-0 shadow-none before:hidden sm:size-(--control) sm:min-w-0",
        "hover:bg-surface-active dark:hover:bg-surface-active hover:text-fg data-pressed:hover:bg-surface-active dark:data-pressed:hover:bg-surface-active data-pressed:text-fg data-has:text-fg data-pressed:bg-transparent dark:data-pressed:bg-transparent",
        "s2s-focus focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-35",
        size === "lg" && "size-10 sm:size-10",
        className,
      )}
      {...props}
    >
      <Icon
        icon={pressed && pressedIcon ? pressedIcon : icon}
        className={cn(
          "opacity-100",
          size === "lg" ? "size-[22px]" : "size-3.5",
        )}
      />
    </Toggle>
  );
}

export { IconToggle, PillToggle };
export type { IconToggleProps, PillToggleProps, PillToggleVariant };
