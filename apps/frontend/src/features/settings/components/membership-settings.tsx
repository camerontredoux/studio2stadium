import { useSubscribed } from "@/lib/session/hooks/use-subscribed";
import { Subscribed } from "./membership/subscribed";
import { Unsubscribed } from "./membership/unsubscribed";

export function MembershipSettings() {
  const { subscribed, cancelAtPeriodEnd, currentPeriodEnd } = useSubscribed();

  if (subscribed) {
    return (
      <Subscribed
        cancelAtPeriodEnd={cancelAtPeriodEnd}
        currentPeriodEnd={currentPeriodEnd}
      />
    );
  }

  return <Unsubscribed />;
}
