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
import { useUnfollowSchool } from "@/shared/api/mutations";
import { type FollowedSchool } from "@/shared/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { dancerQueries } from "../api/queries";

function UnfollowButton({ school }: { school: FollowedSchool }) {
  const { mutate, isPending } = useUnfollowSchool(school);

  return (
    <Button
      disabled={isPending}
      onClick={() => mutate({ params: { path: { id: school.id } } })}
      size="sm"
      variant="ghost"
      className="text-destructive-foreground"
    >
      {isPending ? <Spinner label="Unfollow" /> : "Unfollow"}
    </Button>
  );
}

function FollowingList() {
  const { data } = useSuspenseQuery(dancerQueries.following());

  return (
    <div className="flex flex-col gap-4 pb-4">
      {data.map((school) => (
        <div key={school.username} className="group flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={school.avatar ?? undefined} />
            <AvatarFallback>
              {school.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex w-full min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <DialogClose
                render={
                  <Link
                    className="truncate leading-tight group-hover:underline"
                    to="/explore/$username"
                    params={{ username: school.username }}
                  />
                }
              >
                {school.name}
              </DialogClose>
              <span className="text-muted-foreground text-xs leading-none">
                {school.username}
              </span>
            </div>

            <UnfollowButton school={school} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DancerFollowingDialog({
  children,
}: {
  children: React.ReactElement;
}) {
  return (
    <Dialog>
      <DialogTrigger render={children} className="cursor-pointer" />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Following</DialogTitle>
          <DialogDescription>Schools you are following</DialogDescription>
        </DialogHeader>
        <DialogPanel className="h-96">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            }
          >
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
