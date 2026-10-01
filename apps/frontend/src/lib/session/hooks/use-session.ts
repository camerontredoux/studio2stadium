import { useSuspenseQuery } from "@tanstack/react-query";
import { sessionQueries } from "../queries";
import { isProfileSession, type ProfileSession, type Session } from "../types";

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

/**
 * The session of a dancer or school account, for components of the profile
 * product. The `_app` guard sends an Organizer account to its Org before any
 * of them renders, so an Organizer here is a routing bug, not a state to draw.
 */
export function useProfileSession(): ProfileSession {
  const session = useSession();

  if (!isProfileSession(session)) {
    throw new Error(
      "useProfileSession must be used within the profile product",
    );
  }

  return session;
}
