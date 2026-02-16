import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DIVISIONS } from "@/utils/constants/divisions";
import { US_STATES } from "@/utils/constants/states";
import { Link } from "@tanstack/react-router";
import {
  CalendarIcon,
  GraduationCapIcon,
  MapPinIcon,
  TargetIcon,
  VerifiedIcon,
} from "lucide-react";
import type { School } from "../../types/school";
import { CardInfo } from "./card-info";

export function CardContent({
  school,
  isFollowing,
}: {
  school: School;
  isFollowing?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-1">
          <h3 className="flex min-w-0 items-center gap-1 text-base leading-tight font-semibold">
            <Link
              to="/explore/$username"
              params={{ username: school.username }}
              className="desktop:after:hidden truncate underline-offset-2 group-hover:underline after:absolute after:inset-0 after:content-['']"
            >
              {school.name}
            </Link>
            <VerifiedIcon className="text-brand size-4 shrink-0" />
          </h3>
          {isFollowing !== undefined ? (
            <CardInfo isFollowing={isFollowing} />
          ) : (
            <Skeleton className="h-4 w-19" />
          )}
        </div>
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
        <Badge variant="outline">
          {DIVISIONS[school.division as keyof typeof DIVISIONS] ??
            "No division"}
        </Badge>
        <Badge variant="outline">
          <TargetIcon className="size-3 shrink-0" /> {school.gpa ?? 0} GPA
        </Badge>
        <TooltipProvider delay={100}>
          <Tooltip>
            <TooltipTrigger render={<Badge variant="outline" />}>
              <GraduationCapIcon className="size-3 shrink-0" />{" "}
              {school.size?.toLocaleString() ?? 0}
            </TooltipTrigger>
            <TooltipContent>
              {school.size?.toLocaleString() ?? 0} students
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
