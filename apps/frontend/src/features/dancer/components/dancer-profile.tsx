import { useSession } from "@/lib/session";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dancerQueries } from "../api/queries";

export function DancerProfile({ username }: { username: string }) {
  const session = useSession();
  const { data } = useSuspenseQuery(dancerQueries.profile(username));

  return <pre>{JSON.stringify({ session, data }, null, 2)}</pre>;
}
