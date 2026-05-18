import {
  Select,
  SelectItem,
  SelectPopup,
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
  const [open, setOpen] = useState(false);

  return (
    <Select
      items={AUTH_PAGE_ITEMS}
      open={open}
      onOpenChange={setOpen}
      onValueChange={(value) => {
        setOpen(false);
        if (value === "marketing") {
          window.open(MARKETING_URL, "_blank", "noopener,noreferrer");
          return;
        }
        if (value === "organizations") {
          navigate({ to: "/orgs" });
        }
      }}
    >
      <SelectTrigger
        showIcon={false}
        className={cn(
          "text-brand h-auto min-h-0 w-auto gap-0 border-0 bg-transparent p-0 text-sm font-medium shadow-none ring-0 before:hidden focus-visible:ring-0 sm:min-h-0 dark:bg-transparent",
          className,
        )}
      >
        <SelectValue placeholder="More pages" />
      </SelectTrigger>
      <SelectPopup alignItemWithTrigger={false} className="p-0">
        {AUTH_PAGE_ITEMS.map((item) => (
          <SelectItem
            key={item.value}
            value={item.value}
            className="grid-cols-1 gap-0 py-1.5 ps-2.5 pe-2.5 [&_.col-start-1]:hidden [&_.col-start-2]:col-start-1"
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
}
