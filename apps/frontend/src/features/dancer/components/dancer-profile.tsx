import { useSuspenseQuery } from "@tanstack/react-query";
import { queries } from "../api/queries";

interface DancerProfileProps {
  username: string;
}

export function DancerProfile({ username }: DancerProfileProps) {
  const { data } = useSuspenseQuery(queries.detail(username));

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
