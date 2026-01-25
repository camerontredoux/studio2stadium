import { useSuspenseQuery } from "@tanstack/react-query";
import { queries } from "../api/queries";

interface SchoolProfileProps {
  username: string;
}

export function SchoolProfile({ username }: SchoolProfileProps) {
  const { data } = useSuspenseQuery(queries.detail(username));

  return <div>{data.username}</div>;
}
