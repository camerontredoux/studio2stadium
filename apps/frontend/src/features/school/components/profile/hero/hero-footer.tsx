import { Button } from "@/components/ui/button";
import { schoolQueries } from "@/features/school/api/queries";
import type { SchoolProfile } from "@/features/school/types";
import { useSubscribed } from "@/lib/session/hooks/use-subscribed";
import { queries } from "@/shared/engagement/api/queries";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, HeartIcon, Share2Icon } from "lucide-react";
import { SchoolFollowersDialog } from "../../followers-dialog";
import { SchoolFollowingDialog } from "../../following-dialog";
import { useProfile } from "../context/use-profile";
import { FollowButton } from "../follow-button";
import { ShowInterestDialog } from "./interest-dialog";

export function HeroFooter({ school }: { school: SchoolProfile }) {
  const { isOwner, isPreview, showOwnerControls } = useProfile();
  const navigate = useNavigate({ from: "/explore/$username" });
  const {
    data: { subscribed },
  } = useSubscribed();

  const { data: activity } = useQuery(queries.activity({ enabled: isOwner }));
  const { data: metadata } = useQuery(
    schoolQueries.metadata(school.id, { enabled: !isOwner }),
  );

  const isFollowing = metadata?.following ?? false;
  const isInterested = (metadata?.interested ?? 0) >= 3;

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

        {!isOwner && (
          <>
            <FollowButton school={school} isFollowing={isFollowing} size="sm" />
            {isFollowing && subscribed && !isInterested && (
              <ShowInterestDialog
                schoolId={school.id}
                count={metadata?.interested ?? 0}
              />
            )}
            {isInterested && (
              <Button size="sm" variant="ghost" disabled className="flex-1">
                <HeartIcon className="size-4 fill-current" /> Interested
              </Button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2 max-sm:w-full">
        {showOwnerControls ? (
          <>
            <SchoolFollowersDialog>
              <Button variant="outline" size="sm" className="flex-1">
                {activity?.followers ?? 0} Followers
              </Button>
            </SchoolFollowersDialog>
            <SchoolFollowingDialog>
              <Button variant="outline" size="sm" className="flex-1">
                {activity?.following ?? 0} Following
              </Button>
            </SchoolFollowingDialog>
          </>
        ) : (
          <Button disabled variant="link" size="sm" className="flex-1">
            {metadata?.followers ?? activity?.followers ?? 0} Followers
          </Button>
        )}
      </div>
    </div>
  );
}
