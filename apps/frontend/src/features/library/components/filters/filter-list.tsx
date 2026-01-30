import {
  FilterItem,
  type FilterValue,
} from "@/components/shared/filters/filter-item";
import { Accordion } from "@/components/ui/accordion";
import type { ApiSchemas } from "@/lib/api/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import { queries } from "../../api/queries";

type Filter = ApiSchemas["DancersFiltersResponse"][number];

function ConnectedFilterItem({ filter }: { filter: Filter }) {
  const value = useSearch({
    from: "/_app/(routes)/resources/library",
    select: (search) => search[filter.paramKey],
  });
  const navigate = useNavigate({ from: "/resources/library" });

  const onFilterChange = useCallback(
    (value: FilterValue, options?: { replace?: boolean }) => {
      navigate({
        replace: options?.replace,
        search: (prev) => ({ ...prev, [filter.paramKey]: value }),
      });
    },
    [navigate, filter.paramKey],
  );

  return (
    <FilterItem filter={filter} value={value} onFilterChange={onFilterChange} />
  );
}

export function FilterList() {
  const { data } = useSuspenseQuery(queries.filters());

  return (
    <Accordion defaultValue={[data[0].id]}>
      {data.map((filter) => (
        <ConnectedFilterItem key={filter.id} filter={filter} />
      ))}
    </Accordion>
  );
}
