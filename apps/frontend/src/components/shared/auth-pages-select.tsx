import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/components/utils/cn";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

const MARKETING_URL = "https://studio2stadium.com";

const AUTH_PAGE_ITEMS = [
  { value: "marketing", label: "Marketing" },
  { value: "organizations", label: "Organizations" },
] as const;

type AuthPagesSelectProps = {
  className?: string;
};

export function AuthPagesSelect({ className }: AuthPagesSelectProps) {
  const navigate = useNavigate();
  const [value, setValue] = useState<string | null>(null);

  return (
    <Select
      items={AUTH_PAGE_ITEMS}
      value={value}
      onValueChange={(next) => {
        if (!next) return;
        if (next === "marketing") {
          window.open(MARKETING_URL, "_blank", "noopener,noreferrer");
        } else if (next === "organizations") {
          navigate({ to: "/orgs" });
        }
        setValue(null);
      }}
    >
      <SelectTrigger
        size="sm"
        className={cn("h-7 w-auto min-w-28 gap-1 rounded-md text-xs", className)}
      >
        <SelectValue placeholder="More pages" />
      </SelectTrigger>
      <SelectContent>
        {AUTH_PAGE_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
