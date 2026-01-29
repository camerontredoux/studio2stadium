import { useSession } from "@/lib/session";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queries } from "../../api/queries";
import { FilterItem } from "./filter-item";

export function FilterList() {
  const session = useSession();

  const { data } = useSuspenseQuery(queries.filters(session.type));

  return data.map((filter) => <FilterItem key={filter.id} filter={filter} />);
}
