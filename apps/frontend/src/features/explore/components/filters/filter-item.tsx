import {
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApiSchemas } from "@/lib/api/client";
import { MultiSelectFilter } from "./items/multi-select";

type Filter = ApiSchemas["UsersFiltersResponse"][number];

export function FilterItem({ filter }: { filter: Filter }) {
  const item = (type: Filter["type"]) => {
    switch (type) {
      case "select":
        return (
          <Select items={filter.options}>
            <SelectTrigger>
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "input":
        return <Input placeholder={filter.label} />;
      case "toggle":
        return <Checkbox />;
      case "multi-select":
        return (
          <MultiSelectFilter
            paramKey={filter.paramKey}
            options={filter.options}
          />
        );
    }
  };

  return (
    <AccordionItem value={filter.id} className="px-5">
      <AccordionTrigger>{filter.label}</AccordionTrigger>
      <AccordionPanel>{item(filter.type)}</AccordionPanel>
    </AccordionItem>
  );
}
