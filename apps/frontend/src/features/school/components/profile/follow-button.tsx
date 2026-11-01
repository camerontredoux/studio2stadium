import { useCountdown } from "@/components/hooks/use-countdown";
import { FollowConfirmDialog } from "@/components/shared/follow-confirm-dialog";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import {
  useFollowSchool,
  useUnfollowSchool,
} from "@/shared/engagement/api/mutations";
import type { FollowedSchool } from "@/shared/types";
import { HeartIcon } from "lucide-react";
import { useState } from "react";

export function FollowButton({
  school,
  isFollowing,
  size = "default",
}: {
  school: FollowedSchool;
  isFollowing: boolean;
  size?: "default" | "sm";
}) {
  const { mutate: follow } = useFollowSchool(school);
  const { mutate: unfollow } = useUnfollowSchool(school);

  const [retryAfter, startCountdown] = useCountdown();
  const [confirming, setConfirming] = useState(false);

  // Following sends the dancer's profile to the coach, so it needs
  // confirmation first. Unfollowing doesn't.
  const handleClick = () => {
    if (isFollowing) {
      submit(unfollow);
    } else {
      setConfirming(true);
    }
  };

  const submit = (mutate: typeof follow) => {
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
    <>
      <Button
        size={size}
        variant={isFollowing ? "destructive-outline" : "outline"}
        disabled={!!retryAfter}
        onClick={handleClick}
        className="flex-1"
      >
        <HeartIcon className={isFollowing ? "fill-current" : undefined} />
        {retryAfter
          ? `Retry in ${retryAfter}s`
          : isFollowing
            ? "Unfollow"
            : "Follow"}
      </Button>
      <FollowConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        school={school}
        onConfirm={() => submit(follow)}
      />
    </>
  );
}
