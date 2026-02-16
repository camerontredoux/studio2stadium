import { useCountdown } from "@/components/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { HeartIcon } from "lucide-react";
import { useFollowSchool, useUnfollowSchool } from "@/shared/api/mutations";

export function FollowButton({
  id,
  isFollowing,
}: {
  id: string;
  isFollowing: boolean;
}) {
  const { mutate: follow } = useFollowSchool(id);
  const { mutate: unfollow } = useUnfollowSchool(id);

  const [retryAfter, startCountdown] = useCountdown();

  const handleClick = () => {
    const mutate = isFollowing ? unfollow : follow;
    mutate(
      { params: { path: { id } } },
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
