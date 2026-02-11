import { useSuspenseQuery } from "@tanstack/react-query";
import { sessionQueries } from "../queries";
import type { Session } from "../types";

/**
 * Hook to get the guaranteed user session.
 * @returns Guaranteed user session or throws an error if the session is not found.
 */
export function useSession(): Session {
  const { data: session } = useSuspenseQuery(sessionQueries.session());

  if (!session) {
    throw new Error("useSession must be used within an authenticated route");
  }

  return session;
}
