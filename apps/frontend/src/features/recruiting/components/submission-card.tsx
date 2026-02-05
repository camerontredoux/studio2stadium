import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2Icon,
  CircleDotIcon,
  ClockIcon,
  EyeIcon,
  MapPinIcon,
  XCircleIcon,
} from "lucide-react";
import type {
  ProspectStatus,
  SchoolSubmission,
  VideoStatus,
} from "./mock-data";

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

function prospectBadge(status: ProspectStatus) {
  switch (status) {
    case "accepted":
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2Icon className="size-3" /> Accepted
        </Badge>
      );
    case "in-review":
      return (
        <Badge variant="warning" className="gap-1">
          <ClockIcon className="size-3" /> In Review
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="error" className="gap-1">
          <XCircleIcon className="size-3" /> Rejected
        </Badge>
      );
    case "none":
      return (
        <Badge variant="outline" className="gap-1">
          <CircleDotIcon className="size-3" /> Pending
        </Badge>
      );
  }
}

function videoBadge(status: VideoStatus) {
  switch (status) {
    case "watched":
      return (
        <Badge variant="info" className="gap-1">
          <EyeIcon className="size-3" /> Watched
        </Badge>
      );
    case "none":
      return (
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <EyeIcon className="size-3" /> Not Watched
        </Badge>
      );
  }
}

interface SubmissionCardProps {
  submission: SchoolSubmission;
}

export function SubmissionCard({ submission }: SubmissionCardProps) {
  return (
    <div className="bg-clip-padding relative rounded-xl border overflow-clip p-3 sm:p-4 flex gap-3 bg-linear-to-br from-brand/10 via-background to-background hover:from-brand/16 hover:via-brand/8 transition-colors [content-visibility:auto] [contain-intrinsic-block-size:auto_100px]">
      <div
        className="absolute inset-0 -z-10 text-brand opacity-[0.08] dark:opacity-[0.03] pointer-events-none"
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
      <Avatar className="size-14 sm:size-12 rounded-xl shrink-0">
        <AvatarImage src={submission.avatar} />
        <AvatarFallback>{submission.initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2 min-w-0 flex-1 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1.5 min-w-0 sm:flex-1">
          <div>
            <h3 className="font-semibold text-sm sm:text-base truncate">
              {submission.name}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <MapPinIcon className="size-3 shrink-0" /> {submission.location}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {prospectBadge(submission.prospectStatus)}
            {videoBadge(submission.videoStatus)}
          </div>
        </div>
        <div className="flex gap-2 sm:flex-col sm:shrink-0">
          <Button
            size="xs"
            render={
              <Link
                to="/explore/$username"
                params={{ username: submission.username }}
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
