import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSearch } from "@tanstack/react-router";
import { CircleAlertIcon } from "lucide-react";

export function ErrorMessage() {
  const { reason } = useSearch({ strict: false });

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
