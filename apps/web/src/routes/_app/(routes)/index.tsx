import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Button variant="link" size="xs" render={<Link to="/u/$username" params={{ username: "test" }} />}>Click me</Button>
      <Button variant="link" size="xs" render={<Link to="/onboarding/dancer" />}>Click me</Button>
      <Button variant="outline" render={<Link to="/explore" />}>Explore</Button>
      <Button variant="link">Test</Button>
      <Button variant="secondary">Test</Button>
      <Button variant="default">Test</Button>
      <Button variant="destructive">Test</Button>
      <Button variant="destructive-outline">Test</Button>
      <Button variant="outline">Test</Button>
      <Button variant="ghost">Test</Button>
      <Button size="sm" variant="outline">
        Test
      </Button>
      <Particle />
    </div>
  );
}

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
