import {
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { ApiSchemas } from "@/lib/api/client";
import { MultiSelectFilter } from "./items/multi-select-filter";
import { RangeFilter } from "./items/range-filter";
import { SelectFilter } from "./items/select-filter";
import { SwitchFilter } from "./items/switch-filter";

type Filter = ApiSchemas["DancersFiltersResponse"][number];

export function FilterItem({
  filter,
  hasFilter,
}: {
  filter: Filter;
  hasFilter: boolean;
}) {
  const item = (type: Filter["type"]) => {
    switch (type) {
      case "select":
        return (
          <SelectFilter options={filter.options} paramKey={filter.paramKey} />
        );
      case "input":
        return <Input placeholder={filter.label} />;
      case "toggle":
        return <SwitchFilter paramKey={filter.paramKey} />;
      case "multi-select":
        return (
          <MultiSelectFilter
            paramKey={filter.paramKey}
            options={filter.options}
          />
        );
      case "range":
        return <RangeFilter paramKey={filter.paramKey} />;
    }
  };

  return (
    <AccordionItem value={filter.id} className="relative px-5">
      <AccordionTrigger>
        <div className="flex justify-between w-full items-center gap-2">
          {filter.label} {hasFilter ? <Badge>Active</Badge> : null}
        </div>
      </AccordionTrigger>
      <AccordionPanel>{item(filter.type)}</AccordionPanel>
    </AccordionItem>
  );
}
