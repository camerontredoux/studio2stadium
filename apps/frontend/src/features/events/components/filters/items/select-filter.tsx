import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, useSearch } from "@tanstack/react-router";

interface SelectFilterProps {
  options: { value: string; label: string }[] | undefined;
  paramKey: string;
}

export function SelectFilter({ options, paramKey }: SelectFilterProps) {
  const filters = useSearch({ from: "/_app/(routes)/events/" });
  const navigate = useNavigate({ from: "/events/" });

  const selectedValue = Array.isArray(filters[paramKey])
    ? filters[paramKey][0]
    : filters[paramKey];

  const selectedOption = options?.find(
    (option) => option.value === selectedValue,
  );

  const handleSelect = (value: string | null) => {
    const newValue = value === selectedOption?.value ? undefined : value;
    navigate({
      search: (prev) => {
        return { ...prev, [paramKey]: newValue ?? undefined };
      },
    });
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
