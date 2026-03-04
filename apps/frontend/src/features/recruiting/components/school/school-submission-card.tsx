import { ProfileCard } from "@/components/shared/profile-card/profile-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { US_STATES } from "@/utils/constants/states";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2Icon,
  CircleDotIcon,
  ClockIcon,
  EyeIcon,
  MapPinIcon,
  PlayIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { recruitingQueries } from "../../api/queries";
import { useUpdateSubmissionStatus } from "../../api/mutations";
import type { SchoolSubmission } from "../../types";

interface SchoolSubmissionCardProps {
  submission: SchoolSubmission;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "accepted", label: "Accepted" },
  { value: "released", label: "Released" },
] as const;

function statusBadge(status: SchoolSubmission["status"]) {
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

export function SchoolSubmissionCard({
  submission,
}: SchoolSubmissionCardProps) {
  const { dancer } = submission;
  const queryClient = useQueryClient();
  const updateMutation = useUpdateSubmissionStatus();

  const optimisticUpdate = (updates: Partial<SchoolSubmission>) => {
    const queryKey = recruitingQueries.schoolSubmissions().queryKey;
    const previous = queryClient.getQueryData<SchoolSubmission[]>(queryKey);

    queryClient.setQueryData<SchoolSubmission[]>(queryKey, (old) =>
      old?.map((s) => (s.id === submission.id ? { ...s, ...updates } : s)),
    );

    return previous;
  };

  const handleOpenChange = (open: boolean) => {
    if (open && !submission.watched) {
      const previous = optimisticUpdate({ watched: true });
      updateMutation.mutate(
        {
          params: { path: { id: submission.id } },
          body: { watched: true },
        },
        {
          onError: () => {
            queryClient.setQueryData(
              recruitingQueries.schoolSubmissions().queryKey,
              previous,
            );
          },
        },
      );
    }
  };

  const handleStatusChange = (status: string) => {
    const newStatus = status as SchoolSubmission["status"];
    const previous = optimisticUpdate({ status: newStatus });
    updateMutation.mutate(
      {
        params: { path: { id: submission.id } },
        body: { status: newStatus },
      },
      {
        onError: () => {
          queryClient.setQueryData(
            recruitingQueries.schoolSubmissions().queryKey,
            previous,
          );
        },
      },
    );
  };

  return (
    <ProfileCard
      user={{
        avatar: dancer.avatar,
        username: dancer.username,
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <h3 className="flex min-w-0 items-center gap-1 text-base leading-tight font-semibold">
              <Link
                to="/$username"
                params={{ username: dancer.username }}
                className="desktop:after:hidden truncate underline-offset-2 after:absolute after:inset-0 after:content-[''] hover:underline"
              >
                {dancer.name}
              </Link>
            </h3>
            {dancer.location && (
              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                <MapPinIcon className="text-brand size-3.5 shrink-0" />
                {US_STATES[dancer.location as keyof typeof US_STATES] ??
                  dancer.location}
              </p>
            )}
          </div>
          {submission.youtubeId && (
            <Dialog onOpenChange={handleOpenChange}>
              <DialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="xs"
                    className="relative z-10 shrink-0 gap-1"
                  />
                }
              >
                <PlayIcon className="size-3" /> Watch Video
              </DialogTrigger>
              <DialogContent
                showCloseButton={false}
                className="max-w-7xl overflow-clip"
              >
                <iframe
                  src={`https://www.youtube.com/embed/${submission.youtubeId}`}
                  title={`${dancer.name}'s CRV`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="aspect-video h-full w-full"
                />
                <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      Status:
                    </span>
                    <Select
                      items={STATUS_OPTIONS}
                      value={submission.status}
                      onValueChange={(value) =>
                        value && handleStatusChange(value)
                      }
                      disabled={updateMutation.isPending}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {updateMutation.isPending && <Spinner />}
                  </div>
                  <DialogClose render={<Button variant="secondary" />}>
                    Close
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {statusBadge(submission.status)}
          {watchedBadge(submission.watched)}
        </div>
      </div>
    </ProfileCard>
  );
}
