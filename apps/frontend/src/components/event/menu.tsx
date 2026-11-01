import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { CheckIcon } from "@phosphor-icons/react";
import type * as React from "react";

import { Icon } from "@/components/event/icon";
import {
  segmentedGroupClass,
  segmentedItemClass,
} from "@/components/event/segmented-styles";
import {
  MenuGroup as UiMenuGroup,
  MenuGroupLabel as UiMenuGroupLabel,
  MenuItem as UiMenuItem,
  Menu as UiMenu,
  MenuPopup as UiMenuPopup,
  MenuRadioGroup as UiMenuRadioGroup,
  MenuSeparator as UiMenuSeparator,
  MenuTrigger as UiMenuTrigger,
} from "@/components/ui/menu";
import { cn } from "@/components/utils/cn";

type MenuProps = React.ComponentProps<typeof UiMenu>;
type MenuTriggerProps = React.ComponentProps<typeof UiMenuTrigger>;
type MenuGroupProps = React.ComponentProps<typeof UiMenuGroup>;
type MenuRadioGroupProps = React.ComponentProps<typeof UiMenuRadioGroup>;

/** The menu root (components/ui/menu). Controls open state. */
const Menu = UiMenu;
/** Opens the menu; pass `render={<Button />}` for an S2S button or chip. */
const MenuTrigger = UiMenuTrigger;
/** Groups items under a `MenuGroupLabel`. */
const MenuGroup = UiMenuGroup;
/** Holds `MenuRadioItem`s; `value` / `onValueChange` control the choice. */
const MenuRadioGroup = UiMenuRadioGroup;

// Overrides every components/ui item class the S2S row changes (incl. `sm:`),
// so tailwind-merge drops the originals.
const row =
  "h-[34px] min-h-0 sm:min-h-0 in-data-[density=compact]:h-8 gap-(--space-10) rounded-(--radius-6) px-(--space-8) py-0 " +
  "font-sans text-[13px] sm:text-[13px] leading-[1.4] text-fg text-start cursor-pointer " +
  "data-highlighted:bg-surface-pressed data-highlighted:text-fg data-disabled:opacity-35 " +
  "[&>svg]:mx-0 [&>svg:not([class*='opacity-'])]:opacity-100 [&>svg:not([class*='size-'])]:size-3.5 sm:[&>svg:not([class*='size-'])]:size-3.5";

// The same row for the Base UI radio/checkbox items, which components/ui lays
// out with a fixed leading check that the design doesn't use.
const choiceRow =
  "flex items-center outline-none select-none data-disabled:pointer-events-none " +
  row;

const hintClass =
  "ms-auto shrink-0 font-mono text-[11px] leading-[1.4] tabular-nums text-fg-3";

type MenuDensity = "default" | "compact";

type MenuPopupProps = React.ComponentProps<typeof UiMenuPopup> & {
  /** `default` 34px rows; `compact` 32px rows (filter menus). */
  density?: MenuDensity;
};

/**
 * The menu box: surface-raised, line-control border, 10px radius, pop shadow,
 * 6px padding. Opens 4px below its trigger; pass `align` and a width class.
 */
function MenuPopup({
  className,
  density = "default",
  ...props
}: MenuPopupProps) {
  return (
    <UiMenuPopup
      className={cn(
        "border-line-control bg-surface-raised text-fg rounded-(--radius-10) border font-sans shadow-(--shadow-pop) before:hidden [&>div]:p-(--space-6)",
        className,
      )}
      data-density={density}
      {...props}
    />
  );
}

type MenuItemVariant = "default" | "danger";

type MenuItemProps = Omit<
  React.ComponentProps<typeof UiMenuItem>,
  "variant" | "inset"
> & {
  /** A 14px Phosphor icon before the label. */
  icon?: PhosphorIcon;
  /** A right-aligned mono note, e.g. a count or range. */
  hint?: React.ReactNode;
  /** A control at the end of the row, e.g. a small button. */
  trailing?: React.ReactNode;
  /** `danger` for destructive actions ("Delete event"); place it last. */
  variant?: MenuItemVariant;
};

/** A 34px menu row: optional icon, label, optional hint and trailing control. */
function MenuItem({
  icon,
  hint,
  trailing,
  variant = "default",
  className,
  children,
  ...props
}: MenuItemProps) {
  return (
    <UiMenuItem
      className={cn(
        row,
        variant === "danger" && "text-danger data-highlighted:text-danger",
        className,
      )}
      {...props}
    >
      {icon && <Icon icon={icon} />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint != null && <span className={hintClass}>{hint}</span>}
      {trailing}
    </UiMenuItem>
  );
}

type MenuRadioItemProps = MenuPrimitive.RadioItem.Props & {
  /** A 14px Phosphor icon before the label. */
  icon?: PhosphorIcon;
  /** A right-aligned mono note. */
  hint?: React.ReactNode;
  /** Where the check sits: `end` (after the label, "View as") or `start` (a fixed leading slot, date presets). */
  indicator?: "start" | "end";
};

/** A single-choice row that shows a check in a fixed 14px slot when chosen. */
function MenuRadioItem({
  icon,
  hint,
  indicator = "end",
  className,
  children,
  ...props
}: MenuRadioItemProps) {
  const check = (
    <span aria-hidden className="grid w-3.5 shrink-0 place-items-center">
      <MenuPrimitive.RadioItemIndicator className="grid place-items-center">
        <Icon icon={CheckIcon} className="text-fg" />
      </MenuPrimitive.RadioItemIndicator>
    </span>
  );
  return (
    <MenuPrimitive.RadioItem
      className={cn(choiceRow, className)}
      data-slot="menu-radio-item"
      {...props}
    >
      {indicator === "start" && check}
      {icon && <Icon icon={icon} />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint != null && <span className={hintClass}>{hint}</span>}
      {indicator === "end" && check}
    </MenuPrimitive.RadioItem>
  );
}

type MenuSegmentedOption<V extends string = string> = {
  value: V;
  /** Sentence case ("Light"). Always shown, after the icon. */
  label: string;
  icon?: PhosphorIcon;
};

type MenuSegmentedProps<V extends string = string> = {
  /** Accessible name of the group ("Theme"). */
  label: string;
  options: ReadonlyArray<MenuSegmentedOption<V>>;
  value: V;
  onChange: (value: V) => void;
  className?: string;
};

/**
 * A `Segmented` control inside a menu, e.g. the Light / Dark / System theme.
 * The segments are menu radio items, so arrow keys reach them like any row and
 * picking one leaves the menu open.
 */
function MenuSegmented<V extends string = string>({
  label,
  options,
  value,
  onChange,
  className,
}: MenuSegmentedProps<V>) {
  return (
    <MenuPrimitive.RadioGroup
      aria-label={label}
      value={value}
      onValueChange={(next: V) => onChange(next)}
      className={cn(segmentedGroupClass, "flex w-full", className)}
      data-slot="menu-segmented"
    >
      {options.map((option) => (
        <MenuPrimitive.RadioItem
          key={option.value}
          value={option.value}
          className={cn(
            segmentedItemClass,
            "inline-flex flex-1 cursor-pointer items-center justify-center whitespace-nowrap outline-none select-none",
            "data-checked:bg-surface-pressed data-checked:text-fg data-highlighted:text-fg",
          )}
        >
          {option.icon ? (
            <Icon icon={option.icon} className="size-3.5 opacity-100" />
          ) : null}
          <span>{option.label}</span>
        </MenuPrimitive.RadioItem>
      ))}
    </MenuPrimitive.RadioGroup>
  );
}

type MenuCheckboxItemProps = MenuPrimitive.CheckboxItem.Props & {
  /** A right-aligned mono note, e.g. a count. */
  hint?: React.ReactNode;
};

/** A multi-choice row with a 14px square check box before the label. */
function MenuCheckboxItem({
  hint,
  className,
  children,
  ...props
}: MenuCheckboxItemProps) {
  return (
    <MenuPrimitive.CheckboxItem
      className={cn("group", choiceRow, className)}
      data-slot="menu-checkbox-item"
      {...props}
    >
      <span
        aria-hidden
        className="border-line-check text-on-fg group-data-checked:border-fg group-data-checked:bg-fg grid size-3.5 shrink-0 place-items-center rounded-(--radius-4) border"
      >
        <MenuPrimitive.CheckboxItemIndicator className="grid place-items-center">
          <Icon icon={CheckIcon} size={10} />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint != null && <span className={hintClass}>{hint}</span>}
    </MenuPrimitive.CheckboxItem>
  );
}

type MenuGroupLabelProps = React.ComponentProps<typeof UiMenuGroupLabel>;

/** The mono label heading a menu ("View as"). Use inside `MenuGroup`. */
function MenuGroupLabel({ className, ...props }: MenuGroupLabelProps) {
  return (
    <UiMenuGroupLabel
      className={cn(
        "type-label text-fg-3 px-(--space-8) pt-(--space-6) pb-(--space-8) text-[11px] font-normal",
        className,
      )}
      {...props}
    />
  );
}

type MenuSeparatorProps = React.ComponentProps<typeof UiMenuSeparator>;

/** A 1px `line` rule between item groups (e.g. before a danger item). */
function MenuSeparator({ className, ...props }: MenuSeparatorProps) {
  return (
    <UiMenuSeparator
      className={cn("bg-line mx-0 my-(--space-6)", className)}
      {...props}
    />
  );
}

export {
  Menu,
  MenuCheckboxItem,
  MenuPopup as MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSegmented,
  MenuSeparator,
  MenuTrigger,
};
export type {
  MenuCheckboxItemProps,
  MenuDensity,
  MenuGroupLabelProps,
  MenuGroupProps,
  MenuItemProps,
  MenuItemVariant,
  MenuPopupProps,
  MenuProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuSegmentedOption,
  MenuSegmentedProps,
  MenuSeparatorProps,
  MenuTriggerProps,
};
