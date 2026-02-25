import { useCountdown } from "@/components/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import {
  useFollowSchool,
  useUnfollowSchool,
} from "@/shared/engagement/api/mutations";
import type { FollowedSchool } from "@/shared/types";
import { HeartIcon } from "lucide-react";

export function FollowButton({
  school,
  isFollowing,
}: {
  school: FollowedSchool;
  isFollowing: boolean;
}) {
  const { mutate: follow } = useFollowSchool(school);
  const { mutate: unfollow } = useUnfollowSchool(school);

  const [retryAfter, startCountdown] = useCountdown();

  const handleClick = () => {
    const mutate = isFollowing ? unfollow : follow;
    mutate(
      { params: { path: { id: school.id } } },
      {
        onError: handleApiError({
          onError: (error) => {
            toastManager.add({
              title: "Error",
              description: error.message,
              type: "error",
            });
          },
          onRateLimit: (retryAfter) => {
            startCountdown(retryAfter);
          },
        }),
      },
    );
  };

  return (
    <Button
      variant={isFollowing ? "destructive-outline" : "outline"}
      disabled={!!retryAfter}
      onClick={handleClick}
    >
      <HeartIcon className={isFollowing ? "fill-current" : undefined} />
      {retryAfter
        ? `Retry in ${retryAfter}s`
        : isFollowing
          ? "Unfollow"
          : "Follow"}
    </Button>
  );
}
