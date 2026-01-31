import { useSuspenseQuery } from "@tanstack/react-query";
import { queries } from "../api/queries";

export function DancerProfile({ username }: { username: string }) {
  const { data } = useSuspenseQuery(queries.detail(username));

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
