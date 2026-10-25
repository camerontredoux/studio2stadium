import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import {
  CaretDownIcon,
  CircleNotchIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import * as React from "react";

import { Icon } from "@/components/event/icon";
import {
  pickerEmptyClass,
  pickerGroupLabelClass,
  pickerHeaderClass,
  pickerListClass,
  pickerRowClass,
  pickerSearchClass,
} from "@/components/event/picker-styles";
import {
  Combobox as UiCombobox,
  ComboboxCollection as UiComboboxCollection,
  ComboboxGroup as UiComboboxGroup,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/utils/cn";

// The S2S searchable picker. The field is a plain button showing the chosen label; it opens a
// popup with a search field on top and one scrolling column of rows, the same popup as the time
// picker (shared classes in ./picker-styles). The root is components/ui's combobox (Base UI);
// the trigger, popup and rows are composed from Base UI's Combobox parts, as
// components/event/select does for the select.
//
// For a server search that is the whole point of a dialog (attach an account, find a roster
// entry), compose the parts instead: `ComboboxField` is the visible search box, the popup
// under it has no header, and `ComboboxItem` takes rich children (avatar, name, email).

type ComboboxSize = "md" | "lg";

/** The components/ui (Base UI) combobox root: holds `items`, `value`, `onValueChange`, `itemToStringLabel`. */
const ComboboxRoot = UiCombobox;

const triggerSizes: Record<ComboboxSize, string> = {
  md: "h-(--control)",
  lg: "h-(--control-lg)",
};

type ComboboxTriggerProps = ComboboxPrimitive.Trigger.Props & {
  /** 28px (default) or 32px inside a dialog or sheet. */
  size?: ComboboxSize;
  /** A Phosphor icon at the start of the field, e.g. `GlobeSimpleIcon`. */
  startIcon?: React.ComponentProps<typeof Icon>["icon"];
};

/** The field: an inset button (`bg-300`, `line-control` border, `radius-6`) with an optional icon, the value, and a caret. */
function ComboboxTrigger({
  size = "md",
  startIcon,
  className,
  children,
  ...props
}: ComboboxTriggerProps) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn(
        "border-line-control bg-bg-300 text-fg s2s-input-size relative inline-flex w-full min-w-0 cursor-pointer items-center gap-(--space-6) rounded-(--radius-6) border ps-[9px] pe-[28px] text-left font-normal outline-none select-none",
        "hover:border-line-hover data-popup-open:border-line-focus s2s-focus transition-[border-color] duration-150",
        "aria-invalid:border-danger data-disabled:pointer-events-none data-disabled:opacity-35",
        triggerSizes[size],
        className,
      )}
      {...props}
    >
      {startIcon && <Icon icon={startIcon} className="text-fg-3 shrink-0" />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <Icon
        icon={CaretDownIcon}
        className="text-fg-2 pointer-events-none absolute end-(--space-8)"
      />
    </ComboboxPrimitive.Trigger>
  );
}

type ComboboxPopupProps = ComboboxPrimitive.Popup.Props & {
  sideOffset?: ComboboxPrimitive.Positioner.Props["sideOffset"];
  align?: ComboboxPrimitive.Positioner.Props["align"];
};

/** The popup: `surface-raised`, `line-control` border, `radius-10`, `shadow-pop`, at least as wide as the field. */
function ComboboxPopup({
  className,
  children,
  sideOffset = 6,
  align = "start",
  ...props
}: ComboboxPopupProps) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        data-slot="combobox-positioner"
        className="z-50 select-none"
        sideOffset={sideOffset}
        align={align}
      >
        {/* Same open motion as components/ui/combobox. */}
        <ComboboxPrimitive.Popup
          data-slot="combobox-popup"
          className={cn(
            "border-line-control bg-surface-raised text-fg flex w-(--anchor-width) max-w-(--available-width) min-w-[220px] origin-(--transform-origin) flex-col overflow-hidden rounded-(--radius-10) border shadow-(--shadow-pop) outline-none",
            "transition-[scale,opacity] data-starting-style:scale-98 data-starting-style:opacity-0 motion-reduce:transition-none",
            className,
          )}
          {...props}
        >
          {children}
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

type ComboboxSearchProps = Omit<ComboboxPrimitive.Input.Props, "size"> & {
  /** Names what it searches ("Search time zones"); also the accessible name. */
  placeholder: string;
};

/** The search field in the popup header, styled like the time picker's "Type a time". It takes focus on open. */
function ComboboxSearch({
  placeholder,
  "aria-label": ariaLabel,
  ...props
}: ComboboxSearchProps) {
  return (
    <div className={pickerHeaderClass}>
      <ComboboxPrimitive.Input
        data-slot="combobox-search"
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoComplete="off"
        render={<Input className={pickerSearchClass} />}
        {...props}
      />
    </div>
  );
}

type ComboboxFieldProps = Omit<ComboboxPrimitive.Input.Props, "size"> & {
  /** 28px or 32px (default) inside a dialog or sheet. */
  size?: ComboboxSize;
  /** Show a spinner at the end while results load. */
  loading?: boolean;
};

/**
 * A search box that is the field itself: magnifier, text, and a spinner while `loading`. For
 * server searches; the popup opens under it with the results.
 */
function ComboboxField({
  size = "lg",
  loading = false,
  className,
  ...props
}: ComboboxFieldProps) {
  return (
    <div
      data-slot="combobox-field"
      className="relative flex w-full min-w-0 items-center"
    >
      <Icon
        icon={MagnifyingGlassIcon}
        className="text-fg-3 pointer-events-none absolute start-[9px]"
      />
      <ComboboxPrimitive.Input
        data-slot="combobox-field-input"
        autoComplete="off"
        aria-busy={loading || undefined}
        className={cn(
          "border-line-control bg-bg-300 text-fg s2s-input-size placeholder:text-fg-3 w-full min-w-0 truncate rounded-(--radius-6) border ps-[29px] pe-[29px] outline-none",
          "hover:border-line-hover focus-visible:border-line-focus s2s-focus transition-[border-color] duration-150",
          "aria-invalid:border-danger disabled:opacity-35",
          triggerSizes[size],
          className,
        )}
        {...props}
      />
      {loading && (
        <Icon
          icon={CircleNotchIcon}
          label="Searching"
          className="text-fg-3 absolute end-[9px] animate-spin motion-reduce:animate-none"
        />
      )}
    </div>
  );
}

/** The scrolling column of rows. */
function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(pickerListClass, "empty:hidden", className)}
      {...props}
    />
  );
}

/**
 * One row; the chosen row is the `fg` fill, as in the time list. Text children make a 28px
 * row on one line (truncated). Other children (an avatar and two lines) make a taller row
 * laid out by the caller, with the same padding, radius and highlight.
 */
function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  const text = typeof children === "string" || typeof children === "number";
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        pickerRowClass,
        "text-[12.5px] leading-[1.4]",
        !text && "h-auto min-h-7 justify-start py-(--space-6)",
        className,
      )}
      {...props}
    >
      {text ? <span className="min-w-0 truncate">{children}</span> : children}
    </ComboboxPrimitive.Item>
  );
}

/** A group of rows under a `ComboboxGroupLabel`. Pass the group's `items`. */
function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <UiComboboxGroup
      className={cn("flex flex-col gap-(--space-2)", className)}
      {...props}
    />
  );
}

/** Renders a group's filtered items: `{(item) => <ComboboxItem … />}`. */
const ComboboxCollection = UiComboboxCollection;

/** A group heading inside the list ("Common US"): small, sentence case, `fg-3`. */
function ComboboxGroupLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-group-label"
      className={cn(pickerGroupLabelClass, className)}
      {...props}
    />
  );
}

/** Shown when the search matches nothing ("No time zones match"). */
function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(pickerEmptyClass, className)}
      {...props}
    />
  );
}

type ComboboxOptionGroup = {
  /** The group heading. */
  group: string;
  /** Option values in this group. */
  options: string[];
};

type ComboboxProps = Omit<
  ComboboxTriggerProps,
  "value" | "defaultValue" | "onChange" | "children"
> & {
  /** Option values, or `{ group, options }` groups (shown in order). */
  options: readonly string[] | readonly ComboboxOptionGroup[];
  /** The chosen value; `null` or "" shows the placeholder. */
  value: string | null;
  /** Called with the chosen value, or null when cleared. */
  onChange: (value: string | null) => void;
  /** The text shown and searched for a value. Default: the value itself. */
  optionLabel?: (value: string) => string;
  /** Shown in `fg-3` while nothing is chosen. */
  placeholder?: string;
  /** The search field's placeholder and name ("Search time zones"). Default "Search". */
  searchPlaceholder?: string;
  /** Shown when the search matches nothing. Default "No matches". */
  emptyText?: React.ReactNode;
  /** Accessible name of the list popup. */
  listLabel?: string;
  /** Form field name (submits the value). */
  name?: string;
};

function isGrouped(
  options: readonly string[] | readonly ComboboxOptionGroup[],
): options is readonly ComboboxOptionGroup[] {
  return options.some((option) => typeof option !== "string");
}

type InternalGroup = { value: string; items: string[] };

/** Centres the chosen row in the list once the popup has laid out. */
function scrollToSelected(popup: HTMLElement | null) {
  requestAnimationFrame(() => {
    const list = popup?.querySelector<HTMLElement>("[data-slot=combobox-list]");
    const row = list?.querySelector<HTMLElement>("[data-selected]");
    if (!list || !row) return;
    const listBox = list.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    list.scrollTop +=
      rowBox.top - listBox.top - (list.clientHeight - row.offsetHeight) / 2;
  });
}

/**
 * The standard S2S searchable picker: a field that opens a search box over a list. Type to
 * filter, arrow keys to move, Enter to pick, Escape to close. Options can be grouped; each row
 * stays on one line, and the list opens scrolled to the chosen row.
 */
function Combobox({
  options,
  value,
  onChange,
  optionLabel = (option) => option,
  placeholder,
  searchPlaceholder = "Search",
  emptyText = "No matches",
  listLabel,
  name,
  disabled,
  ...triggerProps
}: ComboboxProps) {
  const popupRef = React.useRef<HTMLDivElement>(null);
  const grouped = isGrouped(options);
  const items = React.useMemo(
    () =>
      isGrouped(options)
        ? options.map((option) => ({
            value: option.group,
            items: option.options,
          }))
        : options,
    [options],
  );

  const renderItem = (option: string) => (
    <ComboboxItem key={option} value={option}>
      {optionLabel(option)}
    </ComboboxItem>
  );

  return (
    <ComboboxRoot<string>
      items={items}
      value={value || null}
      onValueChange={(next: string | null) => onChange(next)}
      onOpenChange={(open: boolean) => {
        if (open) scrollToSelected(popupRef.current);
      }}
      itemToStringLabel={optionLabel}
      name={name}
      disabled={disabled}
      autoHighlight
    >
      <ComboboxTrigger disabled={disabled} {...triggerProps}>
        {value ? (
          optionLabel(value)
        ) : (
          <span className="text-fg-3">{placeholder}</span>
        )}
      </ComboboxTrigger>
      <ComboboxPopup ref={popupRef} aria-label={listLabel}>
        <ComboboxSearch placeholder={searchPlaceholder} />
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {grouped
            ? (group: InternalGroup) => (
                <ComboboxGroup key={group.value} items={group.items}>
                  <ComboboxGroupLabel>{group.value}</ComboboxGroupLabel>
                  <ComboboxCollection>{renderItem}</ComboboxCollection>
                </ComboboxGroup>
              )
            : renderItem}
        </ComboboxList>
      </ComboboxPopup>
    </ComboboxRoot>
  );
}

export {
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxField,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxRoot,
  ComboboxSearch,
  ComboboxTrigger,
};
export type {
  ComboboxFieldProps,
  ComboboxOptionGroup,
  ComboboxPopupProps,
  ComboboxProps,
  ComboboxSearchProps,
  ComboboxSize,
  ComboboxTriggerProps,
};
