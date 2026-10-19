import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dancerQueries } from "@/features/dancer/api/queries";
import { queries } from "@/shared/engagement/api/queries";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { DancerFollowersDialog } from "../../followers-dialog";
import { DancerFollowingDialog } from "../../following-dialog";
import { useProfile } from "../context/use-profile";
import { FavoriteButton } from "../favorite-button";

export function HeroFooter({ dancerId }: { dancerId: string }) {
  const { isOwner, isPreview, showOwnerControls } = useProfile();
  const navigate = useNavigate({ from: "/$username" });

  const { data: activity, isPending: isActivityPending } = useQuery(
    queries.activity({ enabled: isOwner }),
  );
  const { data: metadata, isPending: isMetadataPending } = useQuery(
    dancerQueries.metadata(dancerId, { enabled: !isOwner }),
  );

  const isFollowersPending = isOwner ? isActivityPending : isMetadataPending;

  const handlePreview = () => {
    navigate({
      search: {
        mode: isPreview ? undefined : "preview",
      },
    });
  };

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 max-sm:w-full">
        {isOwner && (
          <Button
            size="sm"
            variant={isPreview ? "destructive-outline" : "outline"}
            className="flex-1"
            onClick={handlePreview}
          >
            {isPreview ? (
              <>
                <EyeOffIcon className="size-4" /> End Preview
              </>
            ) : (
              <>
                <EyeIcon className="size-4" /> Preview
              </>
            )}
          </Button>
        )}

        {!isOwner ? <FavoriteButton dancerId={dancerId} /> : null}
      </div>

      <div className="flex items-center gap-2 max-sm:w-full">
        {showOwnerControls ? (
          <>
            <DancerFollowersDialog>
              <Button variant="outline" size="sm" className="flex-1">
                {activity?.followers ?? 0} Followers
              </Button>
            </DancerFollowersDialog>
            <DancerFollowingDialog>
              <Button variant="outline" size="sm" className="flex-1">
                {activity?.following ?? 0} Following
              </Button>
            </DancerFollowingDialog>
          </>
        ) : isFollowersPending ? (
          <Skeleton className="h-8 w-24 rounded-lg max-sm:flex-1 sm:h-7" />
        ) : (
          <Button disabled variant="link" size="sm" className="flex-1">
            {metadata?.followers ?? activity?.followers ?? 0} Followers
          </Button>
        )}
      </div>
    </div>
  );
}
