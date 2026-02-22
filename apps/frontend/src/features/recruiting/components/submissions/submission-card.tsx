import { Badge } from "@/components/ui/badge";
import type { Submission } from "@/shared/types";
import { US_STATES } from "@/utils/constants/states";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2Icon,
  CircleDotIcon,
  ClockIcon,
  EyeIcon,
  MapPinIcon,
  VerifiedIcon,
} from "lucide-react";
import { ProfileCard } from "../../../../components/shared/profile-card/profile-card";

interface SchoolCardProps {
  submission: Submission;
}

function statusBadge(status: Submission["status"]) {
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

export function SubmissionCard({ submission }: SchoolCardProps) {
  const { school } = submission;

  return (
    <ProfileCard
      user={{
        avatar: school.avatar,
        username: school.username,
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col">
          <h3 className="flex min-w-0 items-center gap-1 text-base leading-tight font-semibold">
            <Link
              to="/explore/$username"
              params={{ username: submission.school.username }}
              className="desktop:after:hidden truncate underline-offset-2 after:absolute after:inset-0 after:content-[''] hover:underline"
            >
              {submission.school.name}
            </Link>
            <VerifiedIcon className="text-brand size-4 shrink-0" />
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground flex items-center gap-1 text-sm">
              <MapPinIcon className="text-brand size-3.5 shrink-0" />{" "}
              {US_STATES[submission.school.location as keyof typeof US_STATES]}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusBadge(submission.status)}
          {watchedBadge(submission.watched)}
        </div>
      </div>
    </ProfileCard>
  );
}
