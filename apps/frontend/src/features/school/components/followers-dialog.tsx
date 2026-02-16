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
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { schoolQueries } from "../api/queries";

function FollowersList() {
  const { data } = useSuspenseQuery(schoolQueries.followers());

  return data.map((follower) => (
    <div key={follower.username} className="flex items-center gap-2">
      <Avatar>
        <AvatarImage src={follower.avatar ?? undefined} />
        <AvatarFallback>
          {follower.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <Link to="/$username" params={{ username: follower?.username }}>
        {follower?.name}
      </Link>
    </div>
  ));
}

export function SchoolFollowersDialog({ count }: { count: number }) {
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
          <DialogDescription>Accounts following you</DialogDescription>
        </DialogHeader>
        <DialogPanel className="max-h-96">
          <Suspense>
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
