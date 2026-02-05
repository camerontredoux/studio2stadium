import { Badge } from "@/components/ui/badge";
import { MapPinIcon, TargetIcon, Users2Icon, VerifiedIcon } from "lucide-react";
import type { School } from "./dancer-card";

export function CardContent({ school }: { school: School }) {
  return (
    <div className="flex flex-1 flex-col gap-2 min-w-0">
      <div>
        <h3 className="font-semibold text-base flex items-center gap-1">
          <span className="truncate">{school.name}</span>
          <VerifiedIcon className="size-4 text-brand shrink-0" />
        </h3>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPinIcon className="text-brand size-3 shrink-0" />{" "}
          {school.location}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {school.division && (
          <Badge variant="secondary" className="rounded-full">
            {school.division}
          </Badge>
        )}
        {school.gpa ? (
          <Badge variant="secondary" className="rounded-full">
            <TargetIcon className="size-3 shrink-0" /> {school.gpa} GPA
          </Badge>
        ) : null}
        {school.size && school.size > 0 ? (
          <Badge variant="secondary" className="rounded-full">
            <Users2Icon className="size-3 shrink-0" />{" "}
            {school.size.toLocaleString()}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
