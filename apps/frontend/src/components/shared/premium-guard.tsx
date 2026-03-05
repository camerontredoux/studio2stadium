import { useSession } from "@/lib/session";
import { useSubscribed } from "@/lib/session/hooks/use-subscribed";
import type { ReactNode } from "react";
import { AccessDenied } from "./access-denied";

interface PremiumGuardProps {
  children: ReactNode;
  /** Custom description for the access denied message */
  description?: string;
  /** Optional className for the wrapper div when showing access denied */
  className?: string;
}

/**
 * Guards content behind a premium subscription for dancers.
 * Shows AccessDenied for unsubscribed dancers, renders children otherwise.
 * Schools pass through without subscription check.
 */
export function PremiumGuard({
  children,
  description = "This is a premium feature. Subscribe to unlock this page and get full access.",
  className,
}: PremiumGuardProps) {
  const session = useSession();
  const { data: subscription } = useSubscribed();

  // Schools don't need subscription - pass through
  if (session.type === "school") {
    return children;
  }

  if (!subscription.subscribed) {
    return (
      <div className={className}>
        <AccessDenied description={description} />
      </div>
    );
  }

  return <>{children}</>;
}
