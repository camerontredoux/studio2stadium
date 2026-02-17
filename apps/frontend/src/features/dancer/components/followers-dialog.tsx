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
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { dancerQueries } from "../api/queries";

function FollowersList() {
  const { data } = useSuspenseQuery(dancerQueries.followers());

  return data.map((follower) => (
    <div key={follower.username} className="flex items-center gap-2">
      <Avatar>
        <AvatarImage src={follower.avatar ?? undefined} />
        <AvatarFallback>
          {follower.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <DialogClose
        render={
          <Link
            className="truncate leading-tight group-hover:underline"
            to="/explore/$username"
            params={{ username: follower?.username }}
          />
        }
      >
        {follower?.name}
      </DialogClose>
    </div>
  ));
}

export function DancerFollowersDialog({ count }: { count: number }) {
  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer">
        <div className="group flex items-center gap-2">
          <p className="text-muted-foreground group-hover:text-foreground">
            Followers
          </p>
          <p className="ml-auto">{count}</p>
        </div>
      </DialogTrigger>
      <DialogContent>
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
