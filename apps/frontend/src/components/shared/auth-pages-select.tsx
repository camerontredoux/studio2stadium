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

const ITEMS_BY_VARIANT = {
  login: [
    { value: "marketing", label: "Marketing" },
    { value: "organizations", label: "Organizations" },
  ],
  orgs: [
    { value: "marketing", label: "Marketing" },
    { value: "login", label: "Main login" },
  ],
} as const;

type AuthPagesSelectProps = {
  variant: keyof typeof ITEMS_BY_VARIANT;
  className?: string;
};

export function AuthPagesSelect({ variant, className }: AuthPagesSelectProps) {
  const navigate = useNavigate();
  const [value, setValue] = useState<string | null>(null);
  const items = ITEMS_BY_VARIANT[variant];

  const select = (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (!next) return;
        if (next === "marketing") {
          window.open(MARKETING_URL, "_blank", "noopener,noreferrer");
        } else if (next === "organizations") {
          navigate({ to: "/orgs" });
        } else if (next === "login") {
          navigate({ to: "/login" });
        }
        setValue(null);
      }}
    >
      <SelectTrigger
        size="sm"
        className={cn(
          "h-7 w-auto gap-1 rounded-md text-xs",
          variant === "orgs" ? "w-fit min-w-0" : "min-w-28",
          className,
        )}
      >
        <SelectValue placeholder="More pages" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (variant === "orgs") {
    return <div className="w-fit self-start">{select}</div>;
  }

  return select;
}
