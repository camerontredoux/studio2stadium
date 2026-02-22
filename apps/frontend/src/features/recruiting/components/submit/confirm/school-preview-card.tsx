import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPinIcon } from "lucide-react";
import type { School } from "../types";
import { getInitials } from "../utils";

interface SchoolPreviewCardProps {
  school: School;
}

export function SchoolPreviewCard({ school }: SchoolPreviewCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <Avatar className="size-8 shrink-0 rounded-lg">
        <AvatarImage src={school.avatar ?? undefined} />
        <AvatarFallback>{getInitials(school.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{school.name}</div>
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <MapPinIcon className="size-3 shrink-0" />
          {school.location}
        </div>
      </div>
    </div>
  );
}
