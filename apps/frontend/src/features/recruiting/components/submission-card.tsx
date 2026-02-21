import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Submission } from "@/shared/types";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2Icon,
  CircleDotIcon,
  ClockIcon,
  EyeIcon,
  MapPinIcon,
} from "lucide-react";

const TROPHY_CLASSES = [
  "absolute -top-2 -left-1 size-12 rotate-15",
  "absolute top-1 left-[30%] size-8 -rotate-20",
  "absolute -top-3 right-[40%] size-10 rotate-40",
  "absolute top-2 right-[15%] size-7 -rotate-10",
  "absolute -top-1 -right-2 size-14 rotate-25",
  "absolute bottom-0 left-[12%] size-9 -rotate-30",
  "absolute -bottom-2 left-[50%] size-11 rotate-10",
  "absolute -bottom-1 right-[8%] size-13 -rotate-18",
] as const;

const TROPHY_PATH =
  "M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 5h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22m7-7.34V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0z";

type SubmissionStatus = Submission["status"];

function statusBadge(status: SubmissionStatus) {
  switch (status) {
    case "accepted":
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2Icon className="size-3" /> Accepted
        </Badge>
      );
    case "in_review":
      return (
        <Badge variant="warning" className="gap-1">
          <ClockIcon className="size-3" /> In Review
        </Badge>
      );
    case "released":
      return (
        <Badge variant="info" className="gap-1">
          <CircleDotIcon className="size-3" /> Released
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="gap-1">
          <CircleDotIcon className="size-3" /> Pending
        </Badge>
      );
  }
}

function watchedBadge(watched: boolean) {
  if (watched) {
    return (
      <Badge variant="info" className="gap-1">
        <EyeIcon className="size-3" /> Watched
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground gap-1">
      <EyeIcon className="size-3" /> Not Watched
    </Badge>
  );
}

interface SubmissionCardProps {
  submission: Submission;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SubmissionCard({ submission }: SubmissionCardProps) {
  return (
    <Link
      to="/explore/$username"
      params={{ username: submission.school.username }}
      className="from-brand/10 via-background to-background hover:from-brand/16 hover:via-brand/8 relative flex gap-3 overflow-clip rounded-xl border bg-linear-to-br bg-clip-padding p-3 transition-colors [contain-intrinsic-block-size:auto_100px] [content-visibility:auto] sm:p-4"
    >
      <div
        className="text-brand pointer-events-none absolute inset-0 -z-10 opacity-[0.08] dark:opacity-[0.03]"
        aria-hidden
      >
        {TROPHY_CLASSES.map((cn, i) => (
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
            <path d={TROPHY_PATH} />
          </svg>
        ))}
      </div>
      <Avatar className="size-14 shrink-0 rounded-xl sm:size-12">
        <AvatarImage src={submission.school.avatar ?? undefined} />
        <AvatarFallback>{getInitials(submission.school.name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1.5 sm:flex-1">
          <div>
            <h3 className="truncate text-sm font-semibold sm:text-base">
              {submission.school.name}
            </h3>
            <p className="text-muted-foreground flex items-center gap-1 text-xs sm:text-sm">
              <MapPinIcon className="size-3 shrink-0" />{" "}
              {submission.school.location}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {statusBadge(submission.status)}
            {watchedBadge(submission.watched)}
          </div>
        </div>
        <div className="hidden gap-2 sm:flex sm:shrink-0 sm:flex-col">
          <Button size="xs">View Profile</Button>
        </div>
      </div>
    </Link>
  );
}
