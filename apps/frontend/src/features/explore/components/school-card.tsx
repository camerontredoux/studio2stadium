import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { MapPinIcon, UserPlusIcon, VerifiedIcon } from "lucide-react";

const GRAD_CAP_CLASSES = [
  "absolute -top-2 -left-1 size-12 rotate-15",
  "absolute top-1 left-[30%] size-8 -rotate-20",
  "absolute -top-3 right-[40%] size-10 rotate-40",
  "absolute top-2 right-[15%] size-7 -rotate-10",
  "absolute -top-1 -right-2 size-14 rotate-25",
  "absolute bottom-0 left-[12%] size-9 -rotate-30",
  "absolute -bottom-2 left-[50%] size-11 rotate-10",
  "absolute -bottom-1 right-[8%] size-13 -rotate-18",
] as const;

const GRAD_CAP_PATH =
  "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z";

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
    <div className="relative rounded-xl border overflow-clip p-3 sm:p-4 flex gap-3 bg-linear-to-br from-brand/10 via-background to-background hover:from-brand/16 hover:via-brand/8 transition-colors [content-visibility:auto] [contain-intrinsic-block-size:auto_100px]">
      <div
        className="absolute inset-0 -z-10 text-brand opacity-[0.08] dark:opacity-[0.03] pointer-events-none"
        aria-hidden
      >
        {GRAD_CAP_CLASSES.map((cn, i) => (
          <svg
            key={i}
            className={cn}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={GRAD_CAP_PATH} />
            <path d="M22 10v6" />
            <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
          </svg>
        ))}
      </div>
      <Avatar className="size-16 sm:size-14 rounded-xl shrink-0">
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
          <Button variant="outline" size="xs" className="gap-2">
            <UserPlusIcon /> Follow
          </Button>
          <Button
            size="xs"
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
