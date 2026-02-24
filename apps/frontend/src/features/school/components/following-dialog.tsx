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
import { useUnfavoriteDancer } from "@/shared/api/mutations";
import { type FavoritedDancer } from "@/shared/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { schoolQueries } from "../api/queries";

function UnfavoriteButton({ dancer }: { dancer: FavoritedDancer }) {
  const { mutate, isPending } = useUnfavoriteDancer(dancer.id);

  return (
    <Button
      disabled={isPending}
      onClick={() => mutate({ params: { path: { id: dancer.id } } })}
      size="sm"
      variant="ghost"
      className="text-destructive-foreground"
    >
      {isPending ? <Spinner label="Unfavorite" /> : "Unfavorite"}
    </Button>
  );
}

function FollowingList() {
  const { data } = useSuspenseQuery(schoolQueries.following());

  return (
    <div className="flex flex-col gap-4 pb-4">
      {data.map((dancer) => (
        <div key={dancer.username} className="group flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={dancer.avatar ?? undefined} />
            <AvatarFallback>
              {dancer.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex w-full min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <DialogClose
                render={
                  <Link
                    className="truncate leading-tight group-hover:underline"
                    to="/$username"
                    params={{ username: dancer.username }}
                  />
                }
              >
                {dancer.name}
              </DialogClose>
              <span className="text-muted-foreground text-xs leading-none">
                {dancer.username}
              </span>
            </div>

            <UnfavoriteButton dancer={dancer} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SchoolFollowingDialog({ count }: { count: number }) {
  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer">
        <div className="group flex items-center gap-2">
          <p className="text-muted-foreground group-hover:text-foreground">
            Favorites
          </p>
          <p className="ml-auto">{count}</p>
        </div>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Favorites</DialogTitle>
          <DialogDescription>Dancers you have favorited</DialogDescription>
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
          <DialogClose render={<Button variant="secondary">Close</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
