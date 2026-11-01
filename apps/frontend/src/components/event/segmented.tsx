import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type * as React from "react";

import { Icon } from "@/components/event/icon";
import {
  segmentedGroupClass,
  segmentedItemClass,
} from "@/components/event/segmented-styles";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/components/utils/cn";

type SegmentedOption<V extends string = string> = {
  value: V;
  /** Sentence case ("Active"). Visually hidden on phones when `icon` is set. */
  label: string;
  /** Mono count after the label. */
  count?: React.ReactNode;
  /** 14px icon that replaces the label on phones. */
  icon?: PhosphorIcon;
};

type SegmentedProps<V extends string = string> = Omit<
  React.ComponentProps<typeof ToggleGroup>,
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "onChange"
  | "multiple"
  | "variant"
  | "size"
  | "children"
> & {
  options: ReadonlyArray<SegmentedOption<V>>;
  value: V;
  onChange: (value: V) => void;
  /** Accessible name of the group ("Filter by status"). */
  label: string;
  /** Show each option's icon instead of its label at every width, not only on phones. */
  iconOnly?: boolean;
};

/** A filter of two to four mutually exclusive views, each with a mono count. Single-select and controlled. */
function Segmented<V extends string = string>({
  options,
  value,
  onChange,
  label,
  iconOnly = false,
  className,
  ...props
}: SegmentedProps<V>) {
  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(next) => {
        const picked = next[0] as V | undefined;
        if (picked !== undefined && picked !== value) onChange(picked);
      }}
      className={cn(segmentedGroupClass, className)}
      {...props}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          title={option.icon ? option.label : undefined}
          className={segmentedItemClass}
        >
          {option.icon ? (
            <Icon
              icon={option.icon}
              className={cn(
                "size-3.5 opacity-100",
                !iconOnly && "bp-phone:block hidden",
              )}
            />
          ) : null}
          <span
            className={cn(
              option.icon && (iconOnly ? "sr-only" : "bp-phone:sr-only"),
            )}
          >
            {option.label}
          </span>
          {option.count !== undefined ? (
            <span className="text-fg-3 font-mono text-[11px] tabular-nums">
              {option.count}
            </span>
          ) : null}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export { Segmented };
export type { SegmentedOption, SegmentedProps };
