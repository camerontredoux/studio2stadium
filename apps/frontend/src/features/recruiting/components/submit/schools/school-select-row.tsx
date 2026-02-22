import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@tanstack/react-router";
import { MapPinIcon } from "lucide-react";
import type { School } from "../types";
import { getInitials } from "../utils";

interface SchoolSelectRowProps {
  school: School;
  selected: boolean;
  onToggle: () => void;
}

export function SchoolSelectRow({
  school,
  selected,
  onToggle,
}: SchoolSelectRowProps) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        selected
          ? "border-brand/30 bg-brand/5"
          : "border-border hover:bg-accent/50"
      }`}
    >
      <Checkbox checked={selected} onCheckedChange={onToggle} />
      <Avatar className="size-9 shrink-0 rounded-lg">
        <AvatarImage src={school.avatar ?? undefined} />
        <AvatarFallback>{getInitials(school.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{school.name}</div>
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <MapPinIcon className="size-3 shrink-0" /> {school.location}
        </div>
      </div>
      <Button
        variant="outline"
        size="xs"
        className="shrink-0"
        render={
          <Link
            to="/explore/$username"
            params={{ username: school.username }}
            target="_blank"
          />
        }
        onClick={(e) => e.stopPropagation()}
      >
        View Profile
      </Button>
    </label>
  );
}
