import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OnFilterChange } from "../filter-item";
import type { FilterValue } from "../types";

interface SelectFilterProps {
  options: { value: string; label: string }[] | undefined;
  value: FilterValue;
  onFilterChange: OnFilterChange;
}

export function SelectFilter({
  options,
  value,
  onFilterChange,
}: SelectFilterProps) {
  const selectedValue = Array.isArray(value) ? value[0] : value;

  const selectedOption = options?.find(
    (option) => option.value === selectedValue,
  );

  const handleSelect = (value: string | null) => {
    const newValue = value === selectedOption?.value ? undefined : value;
    onFilterChange(newValue ?? undefined);
  };

  return (
    <Select
      items={options}
      onValueChange={handleSelect}
      value={selectedOption?.value ?? null}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a value..." />
      </SelectTrigger>
      <SelectContent>
        {options?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
