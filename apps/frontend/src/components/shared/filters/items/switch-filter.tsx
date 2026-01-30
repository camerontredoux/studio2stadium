import { Switch } from "@/components/ui/switch";
import type { FilterValue, OnFilterChange } from "../filter-item";

interface SwitchFilterProps {
  value: FilterValue;
  onFilterChange: OnFilterChange;
}

export function SwitchFilter({ value, onFilterChange }: SwitchFilterProps) {
  const checked = value === "true";

  const handleChange = (checked: boolean) => {
    onFilterChange(checked ? "true" : undefined);
  };

  return <Switch onCheckedChange={handleChange} checked={checked} />;
}
