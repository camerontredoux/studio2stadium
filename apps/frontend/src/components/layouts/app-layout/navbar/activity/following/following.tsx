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
import { DancerFollowing } from "./dancer-following";
import { SchoolFollowing } from "./school-following";

export function Following({ following }: { following: number }) {
  const session = useSession();

  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer">
        <div className="group flex items-center gap-2">
          <p className="text-muted-foreground group-hover:text-foreground">
            Following
          </p>
          <p className="ml-auto">{following}</p>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Following</DialogTitle>
          <DialogDescription>Accounts you are following</DialogDescription>
        </DialogHeader>
        <DialogPanel className="max-h-96">
          <Suspense>
            {session.type === "dancer" ? (
              <DancerFollowing />
            ) : (
              <SchoolFollowing />
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
