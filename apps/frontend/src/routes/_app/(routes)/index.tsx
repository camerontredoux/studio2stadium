import { createFileRoute, Link } from "@tanstack/react-router";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useLogout, useSession } from "@/lib/session";

export const Route = createFileRoute("/_app/(routes)/")({
  component: RouteComponent,
});

function RouteComponent() {
  const session = useSession();
  const logout = useLogout();

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {session.username}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's your latest personalized content from programs you follow.
        </p>
      </div>

      <div className="rounded-xl border p-4 aspect-video max-h-96"></div>
      <div className="rounded-xl border p-4 aspect-video max-h-96"></div>
      <div className="rounded-xl border p-4 aspect-video max-h-96"></div>
      <div className="rounded-xl border p-4 aspect-video max-h-96"></div>
      <div className="rounded-xl border p-4 aspect-video max-h-96"></div>
      <div className="rounded-xl border p-4 aspect-video max-h-96"></div>

      <Button
        variant="link"
        size="xs"
        render={<Link to="/$username" params={{ username: "test" }} />}
      >
        Click me
      </Button>
      <Button variant="link" size="xs" render={<Link to="/onboarding" />}>
        Click me
      </Button>
      <Button variant="outline" render={<Link to="/explore" />}>
        Explore
      </Button>
      <Button variant="link">Test</Button>
      <Button variant="secondary">Test</Button>
      <Button variant="default">Test</Button>
      <Button variant="destructive">Test</Button>
      <Button variant="outline">Test</Button>
      <Button variant="ghost">Test</Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => logout.mutate(undefined)}
      >
        Logout
      </Button>
      <Particle />
    </div>
  );
}

function Particle() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive-outline" />}>
        Delete Account
      </AlertDialogTrigger>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>
            Cancel
          </AlertDialogClose>
          <AlertDialogClose render={<Button variant="destructive" />}>
            Delete Account
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
