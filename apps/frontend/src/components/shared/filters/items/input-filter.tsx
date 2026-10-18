import { useDebouncedCallback } from "@/components/hooks/use-debounced-callback";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
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

  // One timer across renders, so a burst of typing navigates once.
  const debouncedChange = useDebouncedCallback((v: string) => {
    onFilterChange(v || undefined, { replace: true });
  }, 200);

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
