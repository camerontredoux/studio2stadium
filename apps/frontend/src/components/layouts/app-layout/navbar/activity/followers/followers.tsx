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
import { useSession } from "@/lib/session";
import { Suspense } from "react";
import { DancerFollowers } from "./dancer-followers";
import { SchoolFollowers } from "./school-followers";

export function Followers({ followers }: { followers: number }) {
  const session = useSession();

  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer">
        <div className="group flex items-center gap-2">
          <p className="text-muted-foreground group-hover:text-foreground">
            Followers
          </p>
          <p className="ml-auto">{followers}</p>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Followers</DialogTitle>
          <DialogDescription>Accounts following you</DialogDescription>
        </DialogHeader>
        <DialogPanel className="max-h-96">
          <Suspense>
            {session.type === "dancer" ? (
              <DancerFollowers />
            ) : (
              <SchoolFollowers />
            )}
          </Suspense>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Close</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
