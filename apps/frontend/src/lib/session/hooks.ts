import { useRouteContext } from "@tanstack/react-router";

export const useSession = () => {
  const { session } = useRouteContext({ strict: false });

  if (!session) {
    throw new Error("useSession must be used within an authenticated route");
  }

  return session;
};
