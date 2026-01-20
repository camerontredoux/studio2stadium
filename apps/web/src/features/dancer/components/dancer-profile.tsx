import { useSuspenseQuery } from "@tanstack/react-query";
import { dancer } from "..";

interface DancerProfileProps {
  username: string;
}

export function DancerProfile({ username }: DancerProfileProps) {
  const { data } = useSuspenseQuery(dancer.api.queries.dancer(username))

  return <div>{data.username}</div>;
}
