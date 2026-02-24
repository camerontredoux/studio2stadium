import { Button } from "@/components/ui/button";
import { dancerQueries } from "@/features/dancer/api/queries";
import { queries } from "@/shared/api/queries";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, Share2Icon } from "lucide-react";
import { DancerFollowersDialog } from "../../followers-dialog";
import { DancerFollowingDialog } from "../../following-dialog";
import { useProfile } from "../context/use-profile";
import { FavoriteButton } from "../favorite-button";

export function HeroFooter({ dancerId }: { dancerId: string }) {
  const { isOwner, isPreview, showOwnerControls } = useProfile();
  const navigate = useNavigate({ from: "/$username" });

  const { data: activity } = useQuery(queries.activity({ enabled: isOwner }));
  const { data: metadata } = useQuery(
    dancerQueries.metadata(dancerId, { enabled: !isOwner }),
  );

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
          <>
            {!isPreview && (
              <Button size="sm" className="flex-1 sm:hidden">
                <Share2Icon className="size-4" /> Share
              </Button>
            )}
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
          </>
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
        ) : (
          <>
            <Button disabled variant="link" size="sm" className="flex-1">
              {metadata?.followers ?? activity?.followers ?? 0} Followers
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
