import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { debounce } from "@tanstack/pacer";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { useState } from "react";

export function InputFilter({ paramKey }: { paramKey: string }) {
  const filters = useSearch({ from: "/_app/(routes)/explore" });
  const navigate = useNavigate({ from: "/explore" });

  const filter = filters[paramKey];

  const [value, setValue] = useState(filter);
  const [bouncing, setBouncing] = useState(false);

  const debouncedValue = debounce(
    (v: string) => {
      navigate({
        replace: true,
        search: (prev) => {
          return { ...prev, [paramKey]: v || undefined };
        },
      });
      setBouncing(false);
    },
    {
      wait: 500,
    },
  );

  const handleSearch = (value: string) => {
    setValue(value);
    setBouncing(true);
    debouncedValue(value);
  };

  return (
    <InputGroup>
      <Input
        placeholder="Search"
        value={value ?? ""}
        onValueChange={handleSearch}
      />
      <InputGroupAddon align="inline-start">
        {bouncing ? <Spinner /> : <SearchIcon />}
      </InputGroupAddon>
    </InputGroup>
  );
}
