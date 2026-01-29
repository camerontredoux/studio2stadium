import { Accordion } from "@/components/ui/accordion";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { queries } from "../../api/queries";
import { FilterItem } from "./filter-item";

export function FilterList() {
  const filters = useSearch({ from: "/_app/(routes)/explore" });

  const { data } = useSuspenseQuery(queries.filters());

  const filtered = data
    .filter((filter) => filters[filter.paramKey])
    .map((filter) => filter.id);

  return (
    <Accordion defaultValue={[data[0].id]}>
      {data.map((filter) => (
        <FilterItem
          key={filter.id}
          filter={filter}
          hasFilter={filtered.includes(filter.id)}
        />
      ))}
    </Accordion>
  );
}
