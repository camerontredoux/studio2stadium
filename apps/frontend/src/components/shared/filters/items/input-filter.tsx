import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { debounce } from "@tanstack/pacer";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import type { OnFilterChange } from "../filter-item";
import type { FilterValue } from "../types";

interface InputFilterProps {
  value: FilterValue;
  onFilterChange: OnFilterChange;
}

export function InputFilter({
  value: initialValue,
  onFilterChange,
}: InputFilterProps) {
  const [value, setValue] = useState(initialValue);

  const debouncedChange = debounce(
    (v: string) => {
      onFilterChange(v || undefined, { replace: true });
    },
    { wait: 100 },
  );

  const handleSearch = (value: string) => {
    setValue(value);
    debouncedChange(value);
  };

  return (
    <InputGroup>
      <Input
        placeholder="Search"
        value={(value as string) ?? ""}
        onValueChange={handleSearch}
      />
      <InputGroupAddon align="inline-start">
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
  );
}
