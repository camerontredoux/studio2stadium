import { Switch } from "@/components/ui/switch";
import { useNavigate, useSearch } from "@tanstack/react-router";

interface SwitchFilterProps {
  paramKey: string;
}

export function SwitchFilter({ paramKey }: SwitchFilterProps) {
  const search = useSearch({ from: "/_app/(routes)/explore/" });
  const navigate = useNavigate({ from: "/explore/" });

  const checked = search[paramKey] === "true";

  const handleChange = (checked: boolean) => {
    navigate({
      search: (prev) => {
        return {
          ...prev,
          [paramKey]: checked ? "true" : undefined,
        };
      },
    });
  };

  return <Switch onCheckedChange={handleChange} checked={checked} />;
}
