import { useSuspenseQuery } from "@tanstack/react-query";
import { queries } from "../api/queries";

export function UserList() {
  const { data } = useSuspenseQuery(queries.explore());

  return <div>{data.test}</div>;
}
