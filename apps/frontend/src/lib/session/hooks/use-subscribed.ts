import { useSuspenseQuery } from "@tanstack/react-query";
import { sessionQueries } from "../queries";
import { useSession } from "./use-session";

/**
 * Hook to get the user subscription status.
 */
export const useSubscribed = () => {
  const session = useSession();

  const { data } = useSuspenseQuery(
    sessionQueries.subscribed(session.type === "dancer"),
  );

  return data;
};
