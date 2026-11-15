import { useQuery } from "@tanstack/react-query";
import { sessionQueries } from "../queries";
import { useSession } from "./use-session";

/**
 * Hook to get the user subscription status.
 */
export const useSubscribed = () => {
  const session = useSession();
  const isDancer = session.type === "dancer";

  const { data, isPending } = useQuery(sessionQueries.subscribed(isDancer));

  return {
    data: data ?? {
      subscribed: !isDancer,
      access: isDancer ? ("free" as const) : ("premium" as const),
      plan: isDancer ? ("free" as const) : ("premium" as const),
      source: "none" as const,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      grantedBy: null,
      paymentFailed: false,
      upgradeFirstChargeAt: null,
    },
    isPending,
  };
};
