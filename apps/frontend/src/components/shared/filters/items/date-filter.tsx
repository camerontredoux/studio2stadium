import { CalendarPopover } from "@/components/ui/calendar-popover";
import { format, parse } from "date-fns";
import type { OnFilterChange } from "../filter-item";
import type { FilterValue } from "../types";

interface DateFilterProps {
  value: FilterValue;
  onFilterChange: OnFilterChange;
}

const DATE_FORMAT = "yyyy-MM-dd";

export function DateFilter({ value, onFilterChange }: DateFilterProps) {
  const dateValue =
    typeof value === "string"
      ? parse(value, DATE_FORMAT, new Date())
      : undefined;

  const handleSelect = (date: Date | undefined) => {
    onFilterChange(date ? format(date, DATE_FORMAT) : undefined);
  };

  return (
    <CalendarPopover
      value={dateValue}
      onSelect={handleSelect}
      placeholder="Select date"
      labelVariant="PPP"
    />
  );
}
