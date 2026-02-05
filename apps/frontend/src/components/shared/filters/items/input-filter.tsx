import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { debounce } from "@tanstack/pacer";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import type { FilterValue, OnFilterChange } from "../filter-item";

interface InputFilterProps {
  value: FilterValue;
  onFilterChange: OnFilterChange;
}

export function InputFilter({
  value: initialValue,
  onFilterChange,
}: InputFilterProps) {
  const [value, setValue] = useState(initialValue);
  const [bouncing, setBouncing] = useState(false);

  const debouncedChange = debounce(
    (v: string) => {
      onFilterChange(v || undefined, { replace: true });
      setBouncing(false);
    },
    { wait: 100 },
  );

  const handleSearch = (value: string) => {
    setValue(value);
    setBouncing(true);
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
        {bouncing ? <Spinner /> : <SearchIcon />}
      </InputGroupAddon>
    </InputGroup>
  );
}
