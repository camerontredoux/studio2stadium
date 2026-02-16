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
import { useUnfollowSchool } from "@/shared/api/mutations";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { dancerQueries } from "../api/queries";

function UnfollowButton({ id }: { id: string }) {
  const { mutate } = useUnfollowSchool(id);

  return (
    <Button
      onClick={() => mutate({ params: { path: { id } } })}
      size="sm"
      variant="ghost"
      className="text-destructive-foreground"
    >
      Unfollow
    </Button>
  );
}

function FollowingList() {
  const { data } = useSuspenseQuery(dancerQueries.following());

  return (
    <div className="flex flex-col gap-4 pb-4">
      {data.map((follower) => (
        <div key={follower.username} className="group flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={follower.avatar ?? undefined} />
            <AvatarFallback>
              {follower.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex w-full min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <Link
                to="/explore/$username"
                className="truncate leading-tight group-hover:underline"
                params={{ username: follower?.username }}
              >
                {follower?.name}
              </Link>
              <span className="text-muted-foreground text-xs leading-none">
                {follower?.username}
              </span>
            </div>

            {follower.id && <UnfollowButton id={follower.id} />}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DancerFollowingDialog({ count }: { count: number }) {
  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer">
        <div className="group flex items-center gap-2">
          <p className="text-muted-foreground group-hover:text-foreground">
            Following
          </p>
          <p className="ml-auto">{count}</p>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Following</DialogTitle>
          <DialogDescription>Accounts you are following</DialogDescription>
        </DialogHeader>
        <DialogPanel className="max-h-96">
          <Suspense>
            <FollowingList />
          </Suspense>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Close</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
