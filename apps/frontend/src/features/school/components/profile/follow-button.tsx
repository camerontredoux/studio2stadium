import { useCountdown } from "@/components/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { HeartIcon } from "lucide-react";
import { useFollowSchool, useUnfollowSchool } from "../../api/mutations";

export function FollowButton({
  id,
  isFollowing,
}: {
  id: string;
  isFollowing: boolean;
}) {
  const { mutate: follow, isPending: isFollowPending } = useFollowSchool(id);
  const { mutate: unfollow, isPending: isUnfollowPending } =
    useUnfollowSchool(id);

  const [retryAfter, startCountdown] = useCountdown();

  const isPending = isFollowPending || isUnfollowPending;

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
      disabled={isPending || !!retryAfter}
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
