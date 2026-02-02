import { useSession } from "@/lib/session";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queries } from "../api/queries";

export function DancerProfile({ username }: { username: string }) {
  const session = useSession();
  const { data } = useSuspenseQuery(queries.detail(username));

  return <pre>{JSON.stringify({ session, data }, null, 2)}</pre>;
}
