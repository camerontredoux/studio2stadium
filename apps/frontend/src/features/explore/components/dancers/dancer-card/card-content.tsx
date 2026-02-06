import { Badge } from "@/components/ui/badge";
import { MapPinIcon, TargetIcon, Users2Icon, VerifiedIcon } from "lucide-react";
import type { School } from "./dancer-card";

export function CardContent({ school }: { school: School }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div>
        <h3 className="flex items-center gap-1 text-base font-semibold">
          <span className="truncate">{school.name}</span>
          <VerifiedIcon className="text-brand size-4 shrink-0" />
        </h3>
        <p className="text-muted-foreground flex items-center gap-1 text-sm">
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
