import {
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { DateFilter } from "./items/date-filter";
import { InputFilter } from "./items/input-filter";
import { MultiSelectFilter } from "./items/multi-select-filter";
import { RangeFilter } from "./items/range-filter";
import { SelectFilter } from "./items/select-filter";
import { SwitchFilter } from "./items/switch-filter";
import type { Filter, FilterValue } from "./types";

export type OnFilterChange = (
  value: FilterValue,
  options?: { replace?: boolean },
) => void;

export function FilterItem({
  filter,
  value,
  onFilterChange,
}: {
  filter: Filter;
  value: FilterValue;
  onFilterChange: OnFilterChange;
}) {
  const filtered = Array.isArray(value) ? value.length > 0 : Boolean(value);

  const item = (type: Filter["type"]) => {
    switch (type) {
      case "select":
        return (
          <SelectFilter
            options={filter.options}
            value={value}
            onFilterChange={onFilterChange}
          />
        );
      case "input":
        return <InputFilter value={value} onFilterChange={onFilterChange} />;
      case "toggle":
        return <SwitchFilter value={value} onFilterChange={onFilterChange} />;
      case "multi-select":
        return (
          <MultiSelectFilter
            options={filter.options}
            value={value}
            onFilterChange={onFilterChange}
          />
        );
      case "range":
        return <RangeFilter value={value} onFilterChange={onFilterChange} />;
      case "date":
        return <DateFilter value={value} onFilterChange={onFilterChange} />;
    }
  };

  return (
    <AccordionItem value={filter.id} className="relative px-5">
      <AccordionTrigger>
        <div className="flex w-full items-center justify-between gap-2">
          {filter.label} {filtered ? <Badge>Active</Badge> : null}
        </div>
      </AccordionTrigger>
      <AccordionPanel>{item(filter.type)}</AccordionPanel>
    </AccordionItem>
  );
}
