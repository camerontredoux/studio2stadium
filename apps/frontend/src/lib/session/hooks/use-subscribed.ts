import { useSuspenseQuery } from "@tanstack/react-query";
import { sessionQueries } from "../queries";

/**
 * Hook to get the user subscription status.
 */
export function useSubscribed() {
  const { data } = useSuspenseQuery(sessionQueries.subscribed());

  return data;
}
