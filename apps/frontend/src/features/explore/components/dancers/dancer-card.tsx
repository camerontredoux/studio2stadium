import { CardInfo } from "@/components/shared/profile-card/card-info";
import { ProfileCard } from "@/components/shared/profile-card/profile-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Dancer } from "@/shared/types";
import { calculateAge } from "@/utils/calculate-age";
import { US_STATES } from "@/utils/constants/states";
import { Link } from "@tanstack/react-router";
import {
  CalendarIcon,
  GraduationCapIcon,
  MapPinIcon,
  ShieldBanIcon,
  ShieldCheckIcon,
  TargetIcon,
} from "lucide-react";

interface DancerCardProps {
  dancer: Dancer;
  isFollowing?: boolean;
}

export function DancerCard({ dancer, isFollowing }: DancerCardProps) {
  return (
    <ProfileCard user={{ avatar: dancer.avatar, username: dancer.username }}>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-1">
            <h3 className="flex min-w-0 items-center gap-1 text-base leading-tight font-semibold">
              <Link
                to="/$username"
                params={{ username: dancer.username }}
                className="desktop:after:hidden truncate underline-offset-2 after:absolute after:inset-0 after:content-[''] hover:underline"
              >
                {dancer.name}
              </Link>
              {dancer.subscribed ? (
                <ShieldCheckIcon className="text-brand size-4 shrink-0" />
              ) : (
                <ShieldBanIcon className="text-muted-foreground size-4 shrink-0" />
              )}
            </h3>
            {isFollowing !== undefined ? (
              <CardInfo isFollowing={isFollowing} />
            ) : (
              <Skeleton className="h-4 w-19" />
            )}
          </div>
          <p className="text-muted-foreground flex items-center gap-1 text-sm">
            <MapPinIcon className="text-brand size-3.5 shrink-0" />{" "}
            {US_STATES[dancer.location as keyof typeof US_STATES] ||
              dancer.location ||
              "Unknown"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">
            <TargetIcon className="size-3 shrink-0" /> {dancer.gpa ?? 0} GPA
          </Badge>
          <Badge variant="outline">
            <CalendarIcon className="size-3 shrink-0" />{" "}
            {calculateAge(dancer.birthday)}{" "}
            <span className="hidden sm:inline">Years Old</span>
          </Badge>
          {dancer.gradYear && (
            <Badge variant="outline">
              <GraduationCapIcon className="size-3 shrink-0" /> Class of{" "}
              {dancer.gradYear}
            </Badge>
          )}
        </div>
      </div>
    </ProfileCard>
  );
}
