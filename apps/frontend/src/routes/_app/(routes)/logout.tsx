import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLogout } from "@/lib/session";
import { createFileRoute } from "@tanstack/react-router";
import { CircleAlertIcon } from "lucide-react";

export const Route = createFileRoute("/_app/(routes)/logout")({
  component: RouteComponent,
});

function RouteComponent() {
  const { mutate, isPending } = useLogout();

  return (
    <Alert>
      <CircleAlertIcon />
      <AlertTitle>Logout</AlertTitle>
      <AlertDescription>Are you sure you want to logout?</AlertDescription>
      <AlertAction>
        <Button
          disabled={isPending}
          variant="destructive-outline"
          onClick={() => mutate({})}
        >
          {isPending ? <Spinner label="Logging out..." /> : "Logout"}
        </Button>
      </AlertAction>
    </Alert>
  );
}
