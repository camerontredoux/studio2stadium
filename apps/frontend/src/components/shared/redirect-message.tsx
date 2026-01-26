import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSearch } from "@tanstack/react-router";
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";

export function RedirectMessage() {
  const { reason } = useSearch({ strict: false });

  if (reason === "new_account") {
    return (
      <Alert variant="success">
        <CircleCheckIcon />
        <AlertTitle>Account Created</AlertTitle>
        <AlertDescription>
          Your account has been created. Please sign in to continue.
        </AlertDescription>
      </Alert>
    );
  }

  if (reason === "network_error") {
    return (
      <Alert variant="error">
        <CircleAlertIcon />
        <AlertTitle>Network Error</AlertTitle>
        <AlertDescription>
          We were unable to connect to the server.
        </AlertDescription>
      </Alert>
    );
  }

  if (reason === "access_denied") {
    return (
      <Alert variant="error">
        <CircleAlertIcon />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          Your session has expired. Please sign in again.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
