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
        You are on the free tier. Upgrade to get full access.
      </AlertDescription>
      <AlertAction>
        <Button render={<Link to="/checkout" />}>Upgrade to Premium</Button>
      </AlertAction>
    </Alert>
  );
}
