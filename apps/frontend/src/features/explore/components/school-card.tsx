import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  GraduationCapIcon,
  MapPinIcon,
  UserPlusIcon,
  VerifiedIcon,
} from "lucide-react";

export interface School {
  username: string;
  name: string;
  avatar: string;
  initials: string;
  location: string;
  verified: boolean;
  styles: string[];
}

interface SchoolCardProps {
  school: School;
}

export function SchoolCard({ school }: SchoolCardProps) {
  return (
    <div className="relative rounded-xl border overflow-clip p-3 sm:p-4 flex gap-3 bg-linear-to-br from-brand/10 via-brand/5 to-background hover:from-brand/16 hover:via-brand/8 transition-colors">
      <div
        className="absolute inset-0 -z-10 text-brand opacity-[0.12] dark:opacity-[0.06] pointer-events-none"
        aria-hidden
      >
        <GraduationCapIcon className="absolute -top-2 -left-1 size-12 rotate-15" />
        <GraduationCapIcon className="absolute top-1 left-[30%] size-8 -rotate-20" />
        <GraduationCapIcon className="absolute -top-3 right-[40%] size-10 rotate-40" />
        <GraduationCapIcon className="absolute top-2 right-[15%] size-7 -rotate-10" />
        <GraduationCapIcon className="absolute -top-1 -right-2 size-14 rotate-25" />
        <GraduationCapIcon className="absolute bottom-0 left-[12%] size-9 -rotate-30" />
        <GraduationCapIcon className="absolute -bottom-2 left-[50%] size-11 rotate-10" />
        <GraduationCapIcon className="absolute -bottom-1 right-[8%] size-13 -rotate-18" />
      </div>
      <Avatar className="size-12 sm:size-14 rounded-xl shrink-0">
        <AvatarImage src={school.avatar} />
        <AvatarFallback>{school.initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2 min-w-0 flex-1 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-2 min-w-0 sm:flex-1">
          <div>
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-1">
              <span className="truncate">{school.name}</span>
              {school.verified && (
                <VerifiedIcon className="size-4 text-brand shrink-0" />
              )}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <MapPinIcon className="size-3 shrink-0" /> {school.location}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {school.styles.slice(0, 3).map((style) => (
              <Badge key={style} variant="secondary" className="rounded-full">
                {style}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2 sm:flex-col sm:shrink-0">
          <Button variant="outline" size="sm" className="gap-2">
            <UserPlusIcon /> Follow
          </Button>
          <Button
            size="sm"
            render={
              <Link
                to="/explore/$username"
                params={{ username: school.username }}
              />
            }
          >
            View Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
