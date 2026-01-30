import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Fragment } from "react";
import type { FilterValue, OnFilterChange } from "../filter-item";

type Option = { value: string; label: string };

interface MultiSelectFilterProps {
  options: Option[] | undefined;
  value: FilterValue;
  onFilterChange: OnFilterChange;
}

export function MultiSelectFilter({
  options,
  value,
  onFilterChange,
}: MultiSelectFilterProps) {
  const selectedValues = Array.isArray(value) ? value : value?.split(",");

  const selected = options?.filter((option) =>
    selectedValues?.includes(option.value),
  );

  const handleSelect = (values: Option[]) => {
    onFilterChange(values.map((v) => v.value));
  };

  return (
    <Combobox
      onValueChange={(value) => handleSelect(value)}
      autoHighlight
      multiple
      items={options}
      value={selected}
    >
      <ComboboxChips>
        <ComboboxValue>
          {(value: { value: string; label: string }[]) => (
            <Fragment>
              {value?.map((item) => (
                <ComboboxChip aria-label={item.label} key={item.value}>
                  {item.label}
                </ComboboxChip>
              ))}
              <ComboboxInput
                multiple
                aria-label="Select filter option"
                placeholder={value.length > 0 ? undefined : "Select a value..."}
              />
            </Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxPopup>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}
