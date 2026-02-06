import { Badge } from "@/components/ui/badge";
import { DIVISIONS } from "@/utils/constants/divisions";
import { US_STATES } from "@/utils/constants/states";
import {
  CalendarIcon,
  MapPinIcon,
  TargetIcon,
  Users2Icon,
  VerifiedIcon,
} from "lucide-react";
import type { School } from "./school-card";

export function CardContent({ school }: { school: School }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div>
        <h3 className="flex items-center gap-1 text-base font-semibold">
          <span className="truncate">{school.name}</span>
          <VerifiedIcon className="text-brand size-4 shrink-0" />
        </h3>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground flex items-center gap-1 text-sm">
            <MapPinIcon className="text-brand size-3.5 shrink-0" />{" "}
            {US_STATES[school.location as keyof typeof US_STATES]}
          </p>
          {school.events ? (
            <p className="text-muted-foreground flex items-center gap-1 text-sm">
              <CalendarIcon className="text-brand size-3.5 shrink-0" />{" "}
              {school.events} {school.events === 1 ? "event" : "events"}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {school.division && (
          <Badge variant="secondary" className="rounded-full">
            {DIVISIONS[school.division as keyof typeof DIVISIONS]}
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
