import { useCountdown } from "@/components/hooks/use-countdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { RecommendedSchool } from "@/features/feed/types";
import { handleApiError } from "@/lib/api/errors";
import { useFollowSchool } from "@/shared/api/mutations";
import { queries } from "@/shared/api/queries";
import { US_STATES } from "@/utils/constants/states";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MapPinIcon, Users2Icon } from "lucide-react";

export function RecommendedSchool({ school }: { school: RecommendedSchool }) {
  const { data } = useSuspenseQuery(queries.followingIds());
  const { mutate } = useFollowSchool(school);

  const [retryAfter, startCountdown] = useCountdown();

  const handleFollow = () => {
    mutate(
      { params: { path: { id: school.id } } },
      {
        onError: handleApiError({
          onRateLimit: (retryAfter) => {
            startCountdown(retryAfter);
          },
        }),
      },
    );
  };

  const isFollowing = data?.includes(school.id) ?? false;

  return (
    <div className="hover:bg-accent px-5 py-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-12 self-start rounded-xl">
          <AvatarImage src={school.avatar ?? undefined} />
          <AvatarFallback>{school.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            className="hover:text-brand truncate text-sm leading-none font-semibold hover:underline"
            to="/explore/$username"
            params={{
              username: school.username,
            }}
          >
            {school.name}
          </Link>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <MapPinIcon className="text-brand size-3" />{" "}
            {US_STATES[school.location as keyof typeof US_STATES]}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
              <Users2Icon className="text-brand size-3" />{" "}
              {school.size?.toLocaleString()} Students
            </p>
          </div>
        </div>
        <Button
          className="ml-auto"
          size="xs"
          variant="outline"
          onClick={handleFollow}
          disabled={isFollowing || !!retryAfter}
        >
          {retryAfter
            ? `Retry in ${retryAfter}s`
            : isFollowing
              ? "Following"
              : "Follow"}
        </Button>
      </div>
    </div>
  );
}
