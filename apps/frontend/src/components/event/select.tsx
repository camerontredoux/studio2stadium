import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CaretDownIcon, CaretUpIcon, CheckIcon } from "@phosphor-icons/react";
import type * as React from "react";

import { Icon } from "@/components/event/icon";
import {
  Select as UiSelect,
  SelectGroup as UiSelectGroup,
  SelectGroupLabel as UiSelectGroupLabel,
  SelectValue as UiSelectValue,
} from "@/components/ui/select";
import { cn } from "@/components/utils/cn";

// The trigger, popup and item are composed from Base UI's Select parts (the same parts
// components/ui/select uses) so the caret, scroll arrows and check are Phosphor icons.

type SelectSize = "md" | "lg";

/** The components/ui (Base UI) select root: holds `value`, `onValueChange`, `items`. */
const SelectRoot = UiSelect;

type SelectTriggerProps = SelectPrimitive.Trigger.Props & {
  /** 28px (default) or 32px inside a dialog. */
  size?: SelectSize;
};

const triggerSizes: Record<SelectSize, string> = {
  md: "h-(--control) min-h-(--control)",
  lg: "h-(--control-lg) min-h-(--control-lg)",
};

/** The 28px select control with a caret. Put a `SelectValue` inside. */
function SelectTrigger({
  size = "md",
  className,
  children,
  ...props
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "relative inline-flex w-full cursor-pointer items-center justify-between gap-(--space-6) text-left outline-none select-none",
        "border-line-control bg-surface-raised text-fg s2s-input-size rounded-(--radius-6) border ps-[7px] pe-[27px] font-normal",
        "hover:border-line-hover data-popup-open:border-line-hover s2s-focus transition-[border-color] data-disabled:pointer-events-none data-disabled:opacity-35",
        "pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11",
        triggerSizes[size],
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        data-slot="select-icon"
        className="text-fg-2 pointer-events-none absolute end-(--space-8) flex"
      >
        <Icon icon={CaretDownIcon} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

type SelectValueProps = React.ComponentProps<typeof UiSelectValue>;

/** The selected option's label, or the placeholder in `fg-3`. */
function SelectValue({ className, ...props }: SelectValueProps) {
  return (
    <UiSelectValue
      className={cn("data-placeholder:text-fg-3", className)}
      {...props}
    />
  );
}

type SelectPopupProps = SelectPrimitive.Popup.Props & {
  sideOffset?: SelectPrimitive.Positioner.Props["sideOffset"];
  alignItemWithTrigger?: SelectPrimitive.Positioner.Props["alignItemWithTrigger"];
};

const scrollArrow =
  "text-fg-2 z-50 flex h-6 w-full cursor-default items-center justify-center before:pointer-events-none before:absolute before:inset-x-px before:h-[200%] before:from-surface-raised before:from-50%";

/** The option list: `surface-raised`, `line-control` border, `radius-10`, `shadow-pop`, 6px padding. */
function SelectPopup({
  className,
  children,
  sideOffset = 4,
  alignItemWithTrigger = true,
  ...props
}: SelectPopupProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        alignItemWithTrigger={alignItemWithTrigger}
        className="z-50 select-none"
        data-slot="select-positioner"
        sideOffset={sideOffset}
      >
        {/* Same open/close motion as components/ui/select. */}
        <SelectPrimitive.Popup
          className="origin-(--transform-origin) transition-[scale,opacity] has-data-starting-style:scale-98 has-data-starting-style:opacity-0 has-data-[side=none]:scale-100 has-data-[side=none]:transition-none"
          data-slot="select-popup"
          {...props}
        >
          <SelectPrimitive.ScrollUpArrow
            className={cn(
              scrollArrow,
              "top-0 before:top-px before:rounded-t-[9px] before:bg-linear-to-b",
            )}
          >
            <Icon icon={CaretUpIcon} className="relative" />
          </SelectPrimitive.ScrollUpArrow>
          <span className="bg-surface-raised border-line-control relative block h-full rounded-(--radius-10) border shadow-(--shadow-pop)">
            <SelectPrimitive.List
              data-slot="select-list"
              className={cn(
                "max-h-(--available-height) min-w-(--anchor-width) overflow-y-auto p-(--space-6)",
                className,
              )}
            >
              {children}
            </SelectPrimitive.List>
          </span>
          <SelectPrimitive.ScrollDownArrow
            className={cn(
              scrollArrow,
              "bottom-0 before:bottom-px before:rounded-b-[9px] before:bg-linear-to-t",
            )}
          >
            <Icon icon={CaretDownIcon} className="relative" />
          </SelectPrimitive.ScrollDownArrow>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

type SelectItemProps = SelectPrimitive.Item.Props;

/** One 32px option, 13px text, `surface-pressed` when highlighted, 14px check when chosen. */
function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "type-body text-fg grid min-h-8 cursor-pointer grid-cols-[14px_1fr] items-center gap-(--space-8) rounded-(--radius-6) px-(--space-8) outline-none",
        "in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)]",
        "data-highlighted:bg-surface-pressed data-highlighted:text-fg data-disabled:pointer-events-none data-disabled:opacity-35",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="col-start-1 flex">
        <Icon icon={CheckIcon} />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText className="col-start-2 min-w-0">
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

/** A group of options under a `SelectGroupLabel`. */
const SelectGroup = UiSelectGroup;

type SelectGroupLabelProps = React.ComponentProps<typeof UiSelectGroupLabel>;

/** The mono heading of an option group ("Not activated"). */
function SelectGroupLabel({ className, ...props }: SelectGroupLabelProps) {
  return (
    <UiSelectGroupLabel
      className={cn(
        "type-label text-fg-3 px-(--space-8) pt-(--space-8) pb-(--space-4)",
        className,
      )}
      {...props}
    />
  );
}

type SelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

type SelectOptionGroup = {
  group: string;
  options: SelectOption[];
};

type SelectProps = Omit<
  SelectTriggerProps,
  "children" | "onChange" | "value" | "defaultValue"
> & {
  /** Options, or `{ group, options }` groups for long lists. */
  options: ReadonlyArray<SelectOption | SelectOptionGroup>;
  /** Controlled value; `null` shows the placeholder. */
  value?: string | null;
  defaultValue?: string | null;
  /** Called with the chosen option's value. */
  onChange?: (value: string | null) => void;
  /** Shown in `fg-3` while nothing is chosen ("Choose dancer…"). */
  placeholder?: React.ReactNode;
  /** Accessible name when there is no visible label. */
  label?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
};

function isGroup(
  option: SelectOption | SelectOptionGroup,
): option is SelectOptionGroup {
  return "group" in option;
}

function renderOption(option: SelectOption) {
  return (
    <SelectItem
      key={option.value}
      value={option.value}
      disabled={option.disabled}
    >
      {option.label}
    </SelectItem>
  );
}

/** A 28px select for choosing one row from a list. `size="lg"` (32px) inside a dialog. */
function Select({
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  label,
  name,
  required,
  disabled,
  "aria-label": ariaLabel,
  ...props
}: SelectProps) {
  const items = options.flatMap((option) =>
    isGroup(option) ? option.options : [option],
  );

  return (
    <SelectRoot
      items={items}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onChange?.(next)}
      name={name}
      required={required}
      disabled={disabled}
    >
      <SelectTrigger aria-label={ariaLabel ?? label} {...props}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectPopup>
        {options.map((option) =>
          isGroup(option) ? (
            <SelectGroup key={option.group}>
              <SelectGroupLabel>{option.group}</SelectGroupLabel>
              {option.options.map(renderOption)}
            </SelectGroup>
          ) : (
            renderOption(option)
          ),
        )}
      </SelectPopup>
    </SelectRoot>
  );
}

export {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectPopup,
  SelectRoot,
  SelectTrigger,
  SelectValue,
};
export type {
  SelectGroupLabelProps,
  SelectItemProps,
  SelectOption,
  SelectOptionGroup,
  SelectPopupProps,
  SelectProps,
  SelectSize,
  SelectTriggerProps,
  SelectValueProps,
};
