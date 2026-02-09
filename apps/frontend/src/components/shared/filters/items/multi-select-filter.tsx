import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OnFilterChange } from "../filter-item";
import type { FilterValue } from "../types";

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

  const optionsByValue = new Map(options?.map((o) => [o.value, o.label]));

  function renderValue(values: string[]) {
    if (values.length === 0) {
      return "Select a value...";
    }

    const firstLabel = optionsByValue.get(values[0]!) ?? values[0];
    const additional =
      values.length > 1 ? ` (+${values.length - 1} more)` : "";
    return firstLabel + additional;
  }

  return (
    <Select
      aria-label="Select filter option"
      value={selectedValues ?? []}
      onValueChange={(values: string[]) => onFilterChange(values)}
      multiple
    >
      <SelectTrigger>
        <SelectValue>{renderValue}</SelectValue>
      </SelectTrigger>
      <SelectPopup alignItemWithTrigger={false}>
        {options?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
}
