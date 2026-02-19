import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { type ApiSchemas } from "@/lib/api/client";
import { useFollowSchool, useUnfollowSchool } from "@/shared/api/mutations";
import { queries } from "@/shared/api/queries";
import { type FollowedSchool } from "@/shared/types";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { dancerQueries } from "../api/queries";

type Follower = ApiSchemas["DancersMeFollowersResponse"][number];

function FollowToggleButton({
  school,
  isFollowing,
}: {
  school: FollowedSchool;
  isFollowing: boolean;
}) {
  const followMutation = useFollowSchool(school);
  const unfollowMutation = useUnfollowSchool(school);

  const isPending = followMutation.isPending || unfollowMutation.isPending;

  const handleClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate({ params: { path: { id: school.id } } });
    } else {
      followMutation.mutate({ params: { path: { id: school.id } } });
    }
  };

  return (
    <Button
      disabled={isPending}
      onClick={handleClick}
      size="sm"
      variant={isFollowing ? "ghost" : "outline"}
      className={isFollowing ? "text-destructive-foreground" : ""}
    >
      {isPending ? (
        <Spinner label={isFollowing ? "Unfollow" : "Follow"} />
      ) : isFollowing ? (
        "Unfollow"
      ) : (
        "Follow"
      )}
    </Button>
  );
}

function FollowersList() {
  const { data: followers } = useSuspenseQuery(dancerQueries.followers());
  const { data: followingIds } = useQuery(queries.followingIds());

  return (
    <div className="flex flex-col gap-4 pb-4">
      {followers.map((follower: Follower) => {
        const isFollowing = followingIds?.includes(follower.id) ?? false;
        const school: FollowedSchool = {
          id: follower.id,
          username: follower.username,
          avatar: follower.avatar,
          name: follower.name,
        };

        return (
          <div
            key={follower.username}
            className="group flex items-center gap-3"
          >
            <Avatar className="size-9">
              <AvatarImage src={follower.avatar ?? undefined} />
              <AvatarFallback>
                {follower.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex w-full min-w-0 items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col">
                <DialogClose
                  render={
                    <Link
                      className="truncate leading-tight group-hover:underline"
                      to="/explore/$username"
                      params={{ username: follower.username }}
                    />
                  }
                >
                  {follower.name}
                </DialogClose>
                <span className="text-muted-foreground text-xs leading-none">
                  {follower.username}
                </span>
              </div>

              <FollowToggleButton school={school} isFollowing={isFollowing} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DancerFollowersDialog({
  children,
}: {
  children: React.ReactElement;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={children}
        className="cursor-pointer"
        nativeButton={false}
      />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Followers</DialogTitle>
          <DialogDescription>Schools who have favorited you</DialogDescription>
        </DialogHeader>
        <DialogPanel className="h-96">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            }
          >
            <FollowersList />
          </Suspense>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Close</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
