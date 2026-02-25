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
import {
  useFavoriteDancer,
  useUnfavoriteDancer,
} from "@/shared/engagement/api/mutations";
import { type FavoritedDancer } from "@/shared/types";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { schoolQueries } from "../api/queries";

type Follower = ApiSchemas["SchoolsMeFollowersResponse"][number];

function FavoriteToggleButton({
  dancer,
  isFavorited,
}: {
  dancer: FavoritedDancer;
  isFavorited: boolean;
}) {
  const favoriteMutation = useFavoriteDancer(dancer.id);
  const unfavoriteMutation = useUnfavoriteDancer(dancer.id);

  const isPending = favoriteMutation.isPending || unfavoriteMutation.isPending;

  const handleClick = () => {
    if (isFavorited) {
      unfavoriteMutation.mutate({
        params: {
          path: { id: dancer.id },
        },
      });
    } else {
      favoriteMutation.mutate({ params: { path: { id: dancer.id } } });
    }
  };

  return (
    <Button
      disabled={isPending}
      onClick={handleClick}
      size="sm"
      variant={isFavorited ? "ghost" : "outline"}
      className={isFavorited ? "text-destructive-foreground" : ""}
    >
      {isPending ? (
        <Spinner label={isFavorited ? "Unfavorite" : "Favorite"} />
      ) : isFavorited ? (
        "Unfavorite"
      ) : (
        "Favorite"
      )}
    </Button>
  );
}

function FollowersList() {
  const { data: followers } = useSuspenseQuery(schoolQueries.followers());
  const { data: following } = useQuery(schoolQueries.following());

  const favoritedIds = following?.map((d) => d.id) ?? [];

  return (
    <div className="flex flex-col gap-4 pb-4">
      {followers.map((follower: Follower) => {
        const isFavorited = favoritedIds.includes(follower.id);
        const dancer: FavoritedDancer = {
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
                      to="/$username"
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

              <FavoriteToggleButton dancer={dancer} isFavorited={isFavorited} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SchoolFollowersDialog({
  children,
}: {
  children: React.ReactElement;
}) {
  return (
    <Dialog>
      <DialogTrigger render={children} className="cursor-pointer" />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Followers</DialogTitle>
          <DialogDescription>Dancers following you</DialogDescription>
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
          <DialogClose render={<Button variant="secondary">Close</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
