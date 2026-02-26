import { Link } from "@tanstack/react-router";
import { CircleAlertIcon } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";

export function AccessDenied({ description }: { description: string }) {
  return (
    <Alert variant="error">
      <CircleAlertIcon />
      <AlertTitle>Access Denied</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      <AlertAction>
        <Button render={<Link to="/checkout" />}>Upgrade to Premium</Button>
      </AlertAction>
    </Alert>
  );
}
