import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSubscribed } from "@/lib/session/hooks/use-subscribed";
import { Link } from "@tanstack/react-router";
import { AlertCircleIcon } from "lucide-react";

export function FreeTierAlert() {
  const { data: subscription, isPending } = useSubscribed();

  if (isPending) {
    return null;
  }

  if (subscription.subscribed) {
    return null;
  }

  return (
    <Alert variant="warning">
      <AlertCircleIcon />
      <AlertTitle>Free Tier</AlertTitle>
      <AlertDescription>
        Get a Studio 2 Stadium membership to unlock your full profile.
      </AlertDescription>
      <AlertAction>
        <Button render={<Link to="/checkout" />}>Get Started</Button>
      </AlertAction>
    </Alert>
  );
}
