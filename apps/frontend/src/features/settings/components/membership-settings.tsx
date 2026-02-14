import { useSession } from "@/lib/session";
import { Subscribed } from "./membership/subscribed";
import { Unsubscribed } from "./membership/unsubscribed";

export function MembershipSettings() {
  const session = useSession();

  if (!session.subscribed) {
    return <Subscribed />;
  }

  return <Unsubscribed />;
}
