import { GlobeSimpleIcon } from "@phosphor-icons/react";

import { Combobox, type ComboboxProps } from "@/components/event/combobox";
import {
  timezoneLabel,
  timezoneOptions,
} from "@/features/org/live/shared/timezones";

type TimezoneComboboxProps = Omit<
  ComboboxProps,
  "options" | "value" | "onChange" | "optionLabel"
> & {
  /** The IANA name, or "" for none. */
  value: string;
  /** Called with the chosen IANA name, or "" when cleared. */
  onChange: (value: string) => void;
};

/** A searchable time zone field with the US zones. */
function TimezoneCombobox({
  value,
  onChange,
  placeholder = "Pick timezone",
  ...props
}: TimezoneComboboxProps) {
  return (
    <Combobox
      options={timezoneOptions(value)}
      value={value || null}
      onChange={(next) => onChange(next ?? "")}
      optionLabel={timezoneLabel}
      startIcon={GlobeSimpleIcon}
      placeholder={placeholder}
      searchPlaceholder="Search"
      listLabel="Time zones"
      emptyText="No time zones match"
      {...props}
    />
  );
}

export { TimezoneCombobox };
export type { TimezoneComboboxProps };
